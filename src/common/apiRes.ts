export class apiResponse {
    private status: number;
    private message: string;
    private data: any;
    private error: any;
    constructor(status: number, message: string, data: any, error: any) {
        this.status = status;
        this.message = message;
        this.data = data;
        this.error = error;
    }
}