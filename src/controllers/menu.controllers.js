import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as MenuServices from '../services/menu.service.js'


// ----------Read Operations--------------//

export const getBranchMenu = asyncHandler(async (req,res) => {
    const {branchId} = req.params;
    const menu = await MenuServices.getFullMenuByBranch(parseInt(branchId));
    return res.status(200).json(new ApiResponse(200, menu, "Menu fetched successfully"));
});

// ----------Category Operations --------------//

export const createCategory = asyncHandler( async (req,res) => {
    const {branchId} = req.params;
    const { name } = req.body;
    const newCategory = await MenuServices.createMenuCategory(parseInt(branchId), name);
    return res.status(201).json(new ApiResponse(201, newCategory, "Category created successfully"));
})

export const updateCategory = asyncHandler(async (req,res) => {
    const {categoryId} = req.params;
    const {name} = req.body;
    const updatedCategory = await MenuServices.updateMenuCategory(parseInt(categoryId),name);
    return res.status(200).json(new ApiResponse(200, updateCategory, "Category updated successfully"));
})

export const deleteCategory = asyncHandler(async (req,res) => {
    const {categoryId} = req.params;
    await MenuServices.deleteMenuCategory(parseInt(categoryId));
    return res.status(200).json(new ApiResponse(200,{},"Category deleted successfully"));
});

// --------Menu Item Operations--------- //

export const addMenuItem = asyncHandler(async (req,res) => {
    const {categoryId} = req.params;
    const itemData = req.body;
    const newItem = await MenuServices.addMenuItemtoCategory(parseInt(categoryId),itemData);
    return res.status(200).json(new ApiResponse(201, newItem, "Menu item added successfully"));
});

export const updateMenuItem = asyncHandler(async (req,res) => {
    const {itemId} = req.params;
    const itemData = req.body;
    const updatedItem = await MenuServices.updateMenuItem(parseInt(itemId), itemData);
    return res.status(200).json(new ApiResponse(200, updatedItem, "Menu item updated successfully"));
})

export const updateMenuItemAvailability = asyncHandler(async (req, res) => {
    const {itemId} = req.params;
    const {is_available} = req.body;
    const updatedItem = await MenuServices.toggleItemAvailability(parseInt(itemId), is_available);
    return res.status(200).json(new ApiResponse(200, updatedItem, `Item availability updated`));
})

export const deleteMenuItem = asyncHandler(async (req, res) => {
    const {itemId} = req.params;
    await MenuServices.deleteMenuItem(parseInt(itemId));
    return res.status(200).json(new ApiResponse(200, { }, "Menu item deleted successfully"));
})