export enum AccountType {
    USER = "user",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin",
}

export enum Gender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other",
}

export enum LoginType {
    EMAIL = "email",
    GOOGLE = "google",
    FACEBOOK = "facebook",
}

export enum DELETE_REQUEST_STATUS {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
}

export enum ALLOWED_FILE_TYPES {
    IMAGE_JPEG = "image/jpeg",
    IMAGE_PNG = "image/png",
    IMAGE_JPG = "image/jpg",
    IMAGE_SVG = "image/svg+xml",
    PDF = "application/pdf",
}

export enum FILE_TYPE {
    IMAGE = "image",
    PDF = "pdf",
}

export enum DISCOUNT_TYPE {
    PERCENTAGE = "percentage",
    FIXED = "fixed",
}

export enum APPLICABLE_ON {
    ORDER = "order",
    PRODUCT = "product",
}

export enum PaymentStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded",
}

export enum PaymentMethod {
    COD = "cod",
    ONLINE = "online",
    WALLET = "wallet",
}

export enum OrderStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
}


export enum TransactionType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}
