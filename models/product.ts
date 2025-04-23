import IBrand from "./brand";
import ICategory from "./category";
import IMaterial from "./material";
import ISubcategory from "./subcategory";
import ITag from "./tag";

export default interface IProduct {
  id: number;
  name: string;
  description: string;
  brand: IBrand;
  category: ICategory;
  price: number;
  subcategory: ISubcategory;
  material: IMaterial;
  product_tag: Array<{ tag: ITag }>;
  type: "Clothing" | "Accessory";
}
