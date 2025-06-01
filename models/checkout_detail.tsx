export default interface ICheckoutDetail {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    streetAddress: string;
    town: string;
    postalCode: number;
    province: string;
    items: {id: number; quantity: number; total: number}[];
    total: number;
    status: 'PENDING' | 'APPROVED' | 'DECLINED';
}