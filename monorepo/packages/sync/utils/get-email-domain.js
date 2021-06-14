module.exports = (email) => {
  if (!email) return '';
  const parts = email.split('@');
  return parts[1].trim().toLowerCase();
};
