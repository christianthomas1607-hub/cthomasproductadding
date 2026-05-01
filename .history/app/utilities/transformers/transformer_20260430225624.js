async function stringTransform(str) {
  return str
    .trim()
    .replace("  ", "")
    .replace(/\n/g, "") //Removes newline
    .replace(/[^a-zA-Z0-9 ]/g, "") //This strips punctuation, symbols, emojis—everything except letters and numbers:
    .toLowerCase()
    .split(" ") //Splits to array on a space
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) //Make first char uppercase and add chars that are after first char to the end of the first char.
    .join(" "); //Join each word back to being a full string again with space separating each word.
}

export async function itemNameTransform(nameCell) {}

export async function colorsTransform(colorCell) {
  const colorsArray = colorCell.split(/\r?\n/);

  const colorsTransformedArray = [];

  for (const color of colorsArray) {
    const colorTransformed = await stringTransform(color);

    colorsTransformedArray.push(colorTransformed);
    console.log(`__Color:___${colorTransformed}__`);
  }
  return colorsTransformedArray;
}

export async function sizesTransform(sizeCell) {
    
    const sizesTransformedArray = [];
    const sizeMinMaxRange = sizeCell;

    const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

    // 1. Split the range into min and max
  const [minSize, maxSize] = sizeMinMaxRange.split("-");

  // 2. Find their indexes in the sizes array
  const startSizeIndex = sizes.indexOf(minSize.trim());
  const endSizeIndex = sizes.indexOf(maxSize.trim());

  // 3. Loop through the range
  for (let i = startSizeIndex; i <= endSizeIndex; i++) {
    sizesTransformedArray.push(sizes[i]);
  }
  return sizesTransformedArray;
}
