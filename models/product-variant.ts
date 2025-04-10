import IColor from "./color";
import IProduct from "./product";
import ISize from "./size";

interface BaseProductVariant {
  id: number;
  image_urls: string[];
  quantity: number;
  product: IProduct;
}

interface ClothingVariant extends BaseProductVariant {
  product: IProduct & { type: "Clothing" };
  size: ISize;
  color: IColor;
}

interface AccessoryVariant extends BaseProductVariant {
  product: IProduct & { type: "Accessory" };
  size?: null;
  color?: null;
}

type IProductVariant = ClothingVariant | AccessoryVariant;

export default IProductVariant;
