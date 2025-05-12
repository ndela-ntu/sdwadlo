export default interface IBrand {
  id: number;
  name: string;
  logo_url: string;
  media_url: string;
  status: "Active" | "Inactive";
}
