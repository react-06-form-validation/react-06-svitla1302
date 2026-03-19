import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingForm from './BookingForm';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

jest.mock('../../schemas/bookingSchema', () => {
  return {
    __esModule: true,
    ...jest.requireActual('../../schemas/bookingSchema'),
  };
});
import * as schema from '../../schemas/bookingSchema';

jest.mock('../ErrorMessage/ErrorMessage', () => {
  const ErrorMessage = ({ message }) =>
    message ? <div>ErrorMessage: {message}</div> : null;
  ErrorMessage.displayName = 'ErrorMessage';

  return {
    __esModule: true,
    default: ErrorMessage,
  };
});

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
  it('creates schema with time slots fetched from backend', async () => {
    const spy = jest.spyOn(schema, 'createBookingSchema');

    render(<BookingForm />);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(['10:00 AM', '11:00 AM', '1:00 PM']);
    });
  });

  test('renders validation errors using ErrorMessage component', async () => {
    render(<BookingForm />);

    const user = userEvent.setup();
    await user.click(screen.getByText(/Book Event/i));

    expect(await screen.findAllByText(/ErrorMessage:/i)).toHaveLength(6);
  });
});
