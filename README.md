# Event Booking Form

> Validation layer using **Zod** + **React Hook Form** for an event booking system

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)

---

## 📁 Project Structure

```
src/app/
├── schemas/
│   └── bookingSchema.js
└── components/
    ├── BookingForm/
    │   └── BookingForm.jsx
    └── ErrorMessage/
        ├── ErrorMessage.jsx
        └── ErrorMessage.module.css
```

---

## 📋 Form Fields & Validation Rules

| Field | Type | Required | Rule |
|---|---|---|---|
| Booker Name | `string` | ✅ | Min 2 characters |
| Booker Email | `string` | ❌ | Valid email format |
| Event Name | `string` | ✅ | Min 2 characters |
| Event Date | `Date` | ✅ | Must be a future date |
| Number of Guests | `number` | ✅ | Integer · min `1` · max `10` |
| Time Slot | `string` | ✅ | Must match slots from `/api/time-slots` |
| Event Link | `string` | ✅ | Valid URL format |

---

## Components

### `bookingSchema`
Zod schema located in `schemas/bookingSchema.js`. Accepts available time slots as a dynamic array to validate the selected option against the backend response.

### `BookingForm`
React Hook Form component. Fetches time slots from `/api/time-slots`, registers all fields, and resolves against `bookingSchema` via `@hookform/resolvers/zod`. On successful submit shows `alert("Booking successful!")`.

### `ErrorMessage`
Accepts a `message` prop. Renders a `<p>` only when a message is present. Styled via `ErrorMessage.module.css`.

```jsx
<ErrorMessage message={errors.bookerName?.message} />
```

---

## Behaviour

**Validation trigger**

Validation runs on the form submitted. Individual field errors are displayed inline below each input via the `ErrorMessage` component.

**Time slots - dynamic enum**

Available time slots are fetched from the backend and passed into the schema at runtime, so the `z.enum()` check always reflects the actual server state.

**Email is optional**

All fields are required except `bookerEmail`, which may be omitted. When provided, it must still pass email format validation.
