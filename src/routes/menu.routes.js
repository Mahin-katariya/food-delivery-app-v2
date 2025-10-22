import { Router } from "express";
import { verifyJWT } from "../middlewares/tokenVerification";
import { canAccessBranch, canAccessMenuCategory, canAccessMenuItems } from "../middlewares/role.middlewares";

import {
    getBranchMenu,
    createCategory,
    updateCategory,
    deleteCategory,
    addMenuItem,
    updateMenuItem,
    updateMenuItemAvailability,
    deleteMenuItem
} from '../controllers/menu.controllers.js';
import { updateMenuItem } from "../services/menu.service";

const router = Router();

router.use(verifyJWT);

router.route("/branch/:branchId").get(canAccessBranch, getBranchMenu);

// Manage categories for branch
router.route("/branch/:branchId/categories").post(canAccessBranch, createCategory);
router.route("/categories/:categoryId")
        .put(canAccessMenuCategory, updateCategory)
        .delete(canAccessMenuCategory, deleteCategory)

// Add a new items to specific category.
router.route("/categories/:categoryId/items").post(canAccessMenuCategory,addMenuItem)


router.route("/categories/:categoryId/items").post(canAccessMenuCategory, addMenuItem);

// Manage specific menu items.
router.route("/items/:itemId")
        .put(canAccessMenuItems, updateMenuItem)
        .delete(canAccessMenuItems, deleteMenuItem);

// for toggling availability of the menu item.
router.route("/items/:itemId/availability").patch(canAccessMenuItems, updateMenuItemAvailability);