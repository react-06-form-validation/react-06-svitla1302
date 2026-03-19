import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingForm from './BookingForm';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/time-slots', () => {
    return HttpResponse.json(['10:00 AM', '11:00 AM', '1:00 PM']);
  })
);

beforeAll(() => {
  server.listen();
});
beforeEach(() => {
  global.alert = jest.fn();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('BookingForm Component', () => {
  test('renders time slots fetched from API', async () => {
    render(<BookingForm />);

    expect(await screen.findByRole('option', { name: '10:00 AM' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '11:00 AM' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1:00 PM' })).toBeInTheDocument();
  });

  test('shows README-defined validation errors for invalid input', async () => {
    render(<BookingForm />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Booker Name/i), 'J');
    await user.type(screen.getByLabelText(/Event Name/i), 'R');
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    await user.type(
      screen.getByLabelText(/Event Date/i),
      pastDate.toISOString().split('T')[0]
    );
    await user.type(screen.getByLabelText(/Number of Guests/i), '11');
    await user.type(screen.getByLabelText(/Event Link/i), 'https://example.com');
    await user.click(screen.getByText(/Book Event/i));

    expect(
      await screen.findByText(/Booker name must be at least 2 characters long/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Event name must be at least 2 characters long/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Event date must be in the future/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Number of Guests must be less than or equal to 10/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Selected time slot is unavailable/i)
    ).toBeInTheDocument();
  });

  test('submits form successfully when valid data is provided and email is omitted', async () => {
    render(<BookingForm />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Booker Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Event Name/i), 'React Workshop');
    const eventDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    await user.type(
      screen.getByLabelText(/Event Date/i),
      eventDate.toISOString().split('T')[0]
    );
    await user.type(screen.getByLabelText(/Number of Guests/i), '3');

    await waitFor(() =>
      expect(screen.getByRole('option', { name: '10:00 AM' })).toBeInTheDocument()
    );
    await user.selectOptions(screen.getByLabelText(/Time Slot/i), '10:00 AM');

    await user.type(
      screen.getByLabelText(/Event Link/i),
      'https://example.com'
    );

    await user.click(screen.getByText(/Book Event/i));

    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith('Booking successful!')
    );
    expect(global.alert).toHaveBeenCalledTimes(1);
  });

  test('shows Zod errors for invalid email and URL on submit', async () => {
    render(<BookingForm />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Booker Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Booker Email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/Event Name/i), 'React Workshop');
    const eventDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    await user.type(
      screen.getByLabelText(/Event Date/i),
      eventDate.toISOString().split('T')[0]
    );
    await user.type(screen.getByLabelText(/Number of Guests/i), '3');

    await waitFor(() =>
      expect(screen.getByRole('option', { name: '10:00 AM' })).toBeInTheDocument()
    );
    await user.selectOptions(screen.getByLabelText(/Time Slot/i), '10:00 AM');
    await user.type(screen.getByLabelText(/Event Link/i), 'invalid-url');

    const form = screen.getByRole('button', { name: /Book Event/i }).closest('form');
    if (!form) throw new Error('Form element not found');
    fireEvent.submit(form);

    expect(await screen.findByText(/Invalid email address/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Invalid URL. Please enter a valid event link/i)
    ).toBeInTheDocument();
  });

  test('validates time slot against the slots fetched from backend', async () => {
    server.use(
      http.get('/api/time-slots', () => {
        return HttpResponse.json(['2:00 PM']);
      })
    );

    render(<BookingForm />);

    const user = userEvent.setup();

    expect(await screen.findByRole('option', { name: '2:00 PM' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '10:00 AM' })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/Booker Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Event Name/i), 'React Workshop');
    const eventDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    await user.type(
      screen.getByLabelText(/Event Date/i),
      eventDate.toISOString().split('T')[0]
    );
    await user.type(screen.getByLabelText(/Number of Guests/i), '3');
    await user.selectOptions(screen.getByLabelText(/Time Slot/i), '2:00 PM');
    await user.type(screen.getByLabelText(/Event Link/i), 'https://example.com');
    await user.click(screen.getByText(/Book Event/i));

    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith('Booking successful!')
    );
  });
});
