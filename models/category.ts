import ISubcategory from "./subcategory";

export default interface ICategory {
    id: number;
    name: string;
    media_url: string;
    status: "Active" | "Inactive";
}