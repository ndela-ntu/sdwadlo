import IProduct from "./product";
import IProductVariant from "./product-variant";

export default interface IProductTag {
    id: number;
    product: IProduct;
    product_variant: IProductVariant;
}