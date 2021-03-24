import slug from 'slug';

const generateSlug = (title) => {
  const char =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; //Random Generate Every Time From This Given Char
  const length = 5;
  let randomvalue = '';
  for (let i = 0; i < length; i++) {
    const value = Math.floor(Math.random() * char.length);

    randomvalue += char.substring(value, value + 1);
  }

  if (title) {
    return `${randomvalue}-${slug(title)}`;
  }

  return randomvalue;
};

export default generateSlug;
