// 从给定字符串中随机选择一个字符
function getRandomChar(str: string): string {
  return str[Math.floor(Math.random() * str.length)];
}
// 随机打乱数组顺序
function shuffle(array: any[]): any[] {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function generateRandomPassword(): string {
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // 确保每种字符类型至少出现一次
  let password = [
    getRandomChar(lowerCase),
    getRandomChar(upperCase),
    getRandomChar(numbers),
    getRandomChar(specialChars),
  ].join('');

  // 剩余部分随机填充，总长度在8到16之间
  const length = Math.floor(Math.random() * 9) + 8; // 产生8到16之间的随机数
  for (let i = password.length; i < length; i++) {
    const charSet = [lowerCase, upperCase, numbers, specialChars][Math.floor(Math.random() * 4)];
    password += getRandomChar(charSet);
  }

  // 打乱顺序
  password = shuffle(password.split('')).join('');

  return password;
}

export default generateRandomPassword;
