const getColorName = async (hex: string) => {
  const response = await fetch(
    `https://www.thecolorapi.com/id?hex=${hex.replace("#", "")}`
  );
  const data = await response.json();
  return data.name.value;
};

export default getColorName;