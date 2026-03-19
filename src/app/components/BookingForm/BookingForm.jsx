'use client';
import styles from './BookingForm.module.css';

export default function BookingForm() {
  return (
    <form className={styles.form}>
      <div className={styles.inputGroup}>
        <label htmlFor="bookerName" className={styles.label}>
          Booker Name
        </label> 
        <input id="bookerName" name="bookerName" className={styles.input} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="bookerEmail" className={styles.label}>
          Booker Email
        </label>
        <input id="bookerEmail" name="bookerEmail" className={styles.input} type="email" />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="eventName" className={styles.label}>
          Event Name
        </label>
        <input id="eventName" name="eventName" className={styles.input} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="eventDate" className={styles.label}>
          Event Date
        </label>
        <input id="eventDate" name="eventDate" className={styles.input} type="date" />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="numberOfGuests" className={styles.label}>
          Number of Guests
        </label>
        <input id="numberOfGuests" name="numberOfGuests" className={styles.input} type="number" />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="timeSlot" className={styles.label}>
          Time Slot
        </label>
        <select id="timeSlot" name="timeSlot" className={styles.input}>
          <option value="">Select a time slot</option>
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="eventLink" className={styles.label}>
          Event Link (Online)
        </label>
        <input id="eventLink" name="eventLink" className={styles.input} type="url" />
      </div>

      <button className={styles.button} type="submit">
        Book Event
      </button>
    </form>
  );
}
