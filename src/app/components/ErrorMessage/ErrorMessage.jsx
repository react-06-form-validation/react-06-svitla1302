import styles from './ErrorMessage.module.css';
const ErrorMessage = ({message}) => {
  // TODO: implement error message rendering according to README requirements
  if(!message) return null;
  return <p className = {styles.ErrorMessage}>{message}</p>;

  
};

export default ErrorMessage;
