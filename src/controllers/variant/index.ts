import { apiResponse, colorModelName, STATUS_CODE } from "../../common";
import { VariantModel, ProductModel } from "../../database";
import { ColorModel } from "../../database/models/colorModel";
import { createData, getFirstMatch, updateData, getData, responseMessage, findAllWithPopulate, reqInfo } from "../../helpers";
import { addVariantValidation, updateVariantValidation, getVariantValidation, getVariantByIdValidation, deleteVariantValidation } from "../../validations";

export const addVariant = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = addVariantValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const isDuplicate = await getFirstMatch(VariantModel, {
            productId: value.productId,
            "attributes.size": value.attributes.size,
            "attributes.colorId": value.attributes.colorId,
            isDeleted: false,
        }, {}, {});

        if (isDuplicate) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Variant with these attributes already exists"), {}, {}));

        const product = await getFirstMatch(ProductModel, { _id: value.productId }, {}, {});
        if (!product) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Product not found"), {}, {}));

        const color = await getFirstMatch(ColorModel, { _id: value.attributes.colorId }, {}, {});
        if (!color) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Color not found"), {}, {}));

        const sku = `${product.name.trim().replace(/\s+/g, '-').toLowerCase()}-${value.attributes.size.trim().replace(/\s+/g, '-').toLowerCase()}-${color.name.trim().replace(/\s+/g, '-').toLowerCase()}`;

        const variant = await createData(VariantModel, { ...value, sku });
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Variant added successfully"), variant, {}));

    } catch (error) {
        console.error("Error adding variant:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const updateVariant = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateVariantValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const currentVariant = await getFirstMatch(VariantModel, { _id: value.variantId, isDeleted: false }, {}, {});
        if (!currentVariant) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Variant not found"), {}, {}));

        // Determine target attributes to check for duplicates
        const targetProductId = value.productId || currentVariant.productId;

        let targetSize = currentVariant.attributes?.size;
        let targetColorId = currentVariant.attributes?.colorId;

        if (value.attributes) {
            if (value.attributes.size) targetSize = value.attributes.size;
            if (value.attributes.colorId) targetColorId = value.attributes.colorId;
        }

        // Only check duplicate if we have potentially changed the identity
        if (value.productId || (value.attributes && (value.attributes.size || value.attributes.colorId))) {
            const isDuplicate = await getFirstMatch(VariantModel, {
                productId: targetProductId,
                "attributes.size": targetSize,
                "attributes.colorId": targetColorId,
                _id: { $ne: value.variantId },
                isDeleted: false,
            }, {}, {});

            if (isDuplicate) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Variant with these attributes already exists"), {}, {}));
        }

        if (value.sku) delete value.sku;

        const updatedVariant = await updateData(VariantModel, { _id: value.variantId }, value, {});
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Variant updated successfully"), updatedVariant, {}));

    } catch (error) {
        console.error("Error updating variant:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const getVariants = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getVariantValidation.validate(req.query);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { productFilter, colorFilter, search } = value;
        const query: any = {};

        if (productFilter) {
            query.productId = productFilter;
        }

        if (colorFilter) {
            query['attributes.colorId'] = colorFilter;
        }

        if (search) {
            query.sku = { $regex: search, $options: "si" };
        }

        const variants = await findAllWithPopulate(VariantModel, query, {}, {}, {
            path: "attributes.colorId",
            model: colorModelName
        });
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Variants fetched successfully"), variants, {}));

    } catch (error) {
        console.error("Error fetching variants:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const getVariantById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getVariantByIdValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const variant = await getFirstMatch(VariantModel, { _id: value.id, isDeleted: false }, {}, {});
        if (!variant) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Variant not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Variant fetched successfully"), variant, {}));

    } catch (error) {
        console.error("Error fetching variant:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const deleteVariant = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteVariantValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const variant = await updateData(VariantModel, { _id: value.id }, { isDeleted: true }, {});
        if (!variant) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Variant not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Variant deleted successfully"), {}, {}));

    } catch (error) {
        console.error("Error deleting variant:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};
