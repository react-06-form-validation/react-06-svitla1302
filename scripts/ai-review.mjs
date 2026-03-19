import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import https from 'https';



const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN       = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY  = process.env.GITHUB_REPOSITORY;
const COMMIT_SHA         = process.env.COMMIT_SHA;
const TEST_EXIT_CODE     = parseInt(process.env.TEST_EXIT_CODE ?? '1', 10);
const TEST_OUTPUT_FILE   = process.env.TEST_OUTPUT_FILE ?? 'test-output.txt';

const ALLOWED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
const MAX_CODE_CHARS     = 12000;
const MAX_TEST_CHARS     = 3000;


function readTask() {
  if (!existsSync('README.md')) return '_(README.md не знайдено)_';
  return readFileSync('README.md', 'utf8').slice(0, 4000);
}


function getStudentSolution() {
  let diffOutput = '';

  try {
    const firstCommit = execSync('git rev-list --max-parents=0 HEAD', { encoding: 'utf8' }).trim();
    diffOutput = execSync(
      `git diff ${firstCommit} HEAD -- ${ALLOWED_EXTENSIONS.map(e => `"*${e}"`).join(' ')}`,
      { encoding: 'utf8' }
    );
  } catch {
    try {
      const files = execSync('git ls-files', { encoding: 'utf8' })
        .trim().split('\n')
        .filter(f => f && ALLOWED_EXTENSIONS.some(ext => f.endsWith(ext)));

      for (const file of files) {
        if (!existsSync(file)) continue;
        diffOutput += `\n### ${file}\n${readFileSync(file, 'utf8')}\n`;
      }
    } catch {
      diffOutput = '_(не вдалося отримати код)_';
    }
  }

  if (!diffOutput.trim()) return '_(студент не вніс жодних змін відносно заготовки)_';

  return diffOutput.length > MAX_CODE_CHARS
    ? diffOutput.slice(0, MAX_CODE_CHARS) + '\n\n_(diff обрізано через розмір)_'
    : diffOutput;
}



function readTestOutput() {
  if (!existsSync(TEST_OUTPUT_FILE)) return '_(файл з результатами тестів не знайдено)_';
  const raw = readFileSync(TEST_OUTPUT_FILE, 'utf8');
  return raw.length > MAX_TEST_CHARS
    ? raw.slice(0, MAX_TEST_CHARS) + '\n...(обрізано)'
    : raw;
}


async function reviewSuccess(task, studentDiff) {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const systemPrompt = `Ти — досвідчений розробник і метор JavaScript/TypeScript.
  Оцінюєш рішення студентов об'єктивно і конструктивно.
  Відповідай ТІЛЬКИ українською мовою. Формат відповіді — Markdown.`;

  const userPrompt = `Тести пройшли успішно. Оціни **якість рішення** студента.

  ## Завдання (з README.md)
  ${task}

  ## Що студент написав (git diff від заготовки)
  ${studentDiff}

  ---

  Твоя оцінка має містити:

  ### 1. Відповідність завданню
  Чи виконано всі вимоги? Чи є щось зайве або відсутнє?

  ### 2. Якість коду
  Оціни за такими критеріями — для кожного:
  ✅ Добре / ⚠️ Є зауваження / ❌ Проблема:
    - Читабельність і найменування (змінні, функції)
    - Структура і логіка рішення
    - Обробка граничних випадків / помилок
    - Відповідність JavaScript/TypeScript best practices та конвенціям

  ### 3. Рекомендації до покращення
  Конкретні поради що і як можна зробити краще. Якщо є антипатерн — покажи як переписати (короткий приклад).

  ### Підсумок
  Загальна оцінка: 🌟 Відмінно / 👍 Добре / 🔧 Потребує доробки / ❗ Серйозні проблеми
  2–3 речення загального висновку.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1800,
    system: systemPrompt,
    messages: [ { role: 'user', content: userPrompt } ],
  });

  return message.content[0].text;
}

async function reviewFailure(task, studentDiff, testOutput) {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const systemPrompt = `Ти — досвідчений розробник і ментор JavaScript/TypeScript.
  Допомагаєш студентам знайти і зрозуміти помилки, але не даєш готового рішення.
  Відповідай ТІЛЬКИ українською мовою. Формат відповіді — Markdown.`;

  const userPrompt = `Тести **не пройшли** ❌. Допоможи студенту знайти проблему.

  ## Завдання (з README.md)
  ${task}

  ## Що студент написав (git diff від заготовки)
  ${studentDiff}

  ## Вивід тестів
  \`\`\`
  ${testOutput}
  \`\`\`

  ---

  Твій аналіз має містити:

  ### 1. Що пішло не так
  Поясни які саме тести впали і чому (спираючись на вивід тестів).

  ### 2. Де проблема в коді
  Вкажи конкретне місце в коді студента яке спричиняє помилку. Процитуй рядок або фрагмент.

  ### 3. Підказка
  Поясни **як думати** про вирішення — але НЕ давай готового коду рішення.
  Можна показати синтаксис або короткий нейтральний приклад якщо це допоможе зрозуміти концепцію.

  ### 4. Що перевірити додатково
  Інші потенційні проблеми які ти помітив у коді, навіть якщо тести на них не впали.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [ { role: 'user', content: userPrompt } ],
  });

  return message.content[0].text;
}


function postCommitComment(repo, sha, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ body });
    const [owner, repoName] = repo.split('/');

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repoName}/commits/${sha}/comments`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ GITHUB_TOKEN }`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'AI-Review-Bot',
        'Accept': 'application/vnd.github+json',
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(JSON.parse(responseBody));
        } else {
          reject(new Error(`GitHub API error ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}


async function main() {
  console.log('🤖 AI Review запущено...');

  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY не задано');
  if (!GITHUB_TOKEN)      throw new Error('GITHUB_TOKEN не задано');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY ne задано');
  if (!COMMIT_SHA)        throw new Error('COMMIT_SHA не задано');

  const testsPassed = TEST_EXIT_CODE === 0;
  console.log(`🧪 Тести: ${testsPassed ? '✅ пройшли': '❌ впали' }`);

  const task        = readTask();
  const studentDiff = getStudentSolution();

  console.log('🧠 Надсилаємо запит до Claude...');

  let reviewText;
  let statusBadge;

  if (testsPassed) {
    reviewText  = await reviewSuccess(task, studentDiff);
    statusBadge = '✅ Тести пройшли';
  } else {
    const testOutput = readTestOutput();
    reviewText  = await reviewFailure(task, studentDiff, testOutput);
    statusBadge = '❌ Тести не пройшли';
  }

  const comment = `## 🤖 AI Code Review · ${statusBadge}

${reviewText}

---
_Автоматична перевірка · commit \`${COMMIT_SHA.slice(0, 7)}\`_`;

  console.log('💬 Публікуємо коментар...');
  await postCommitComment(GITHUB_REPOSITORY, COMMIT_SHA, comment);
  console.log('✅ Готово!');
}

main().catch(err => {
  console.error('❌ Помилка:', err.message);
  process.exit(1);
});
