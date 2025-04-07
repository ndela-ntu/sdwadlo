import IColor from "./color";
import IProduct from "./product";
import ISize from "./size";

export default interface IProductVariant {
    id: number;
    product: IProduct;
    size: ISize;
    color: IColor;
    image_urls: string[];
    quantity: number;
}