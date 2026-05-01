export async function itemNameTransform(nameCell) {}

export async function colorsTransform(colorCell) {
  const colorsArray = colorCell.split(/\r?\n/);

  const colorsTransformedArray = [];

    for (const color of colorsArray) {
      const colorTransformed = await stringTransform(color);

      colorsTransformedArray.push(colorTransformed);
      console.log(`__Color:___${colorTransformed}__`);
    }
}

export async function sizesTransform(sizeCell) {}
