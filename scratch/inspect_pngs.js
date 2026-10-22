const fs = require('fs');

function getPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.toString('ascii', 1, 4) === 'PNG') {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height, size: buf.length };
  }
  return { size: buf.length };
}

console.log('Desktop/ID Front.png:', getPngDimensions('C:\\Users\\meet2\\Desktop\\ID Front.png'));
console.log('Desktop/airtel.png:', getPngDimensions('C:\\Users\\meet2\\Desktop\\airtel.png'));
console.log('New folder/ID Front.png:', getPngDimensions('C:\\Users\\meet2\\Desktop\\New folder\\ID Front.png'));
console.log('New folder/ID Front(1).png:', getPngDimensions('C:\\Users\\meet2\\Desktop\\New folder\\ID Front(1).png'));
console.log('New folder/ID Front(2).png:', getPngDimensions('C:\\Users\\meet2\\Desktop\\New folder\\ID Front(2).png'));
