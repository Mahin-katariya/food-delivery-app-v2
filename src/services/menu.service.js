import prisma from "../db/prisma";
import { ApiError } from "../utils/ApiError";

// ----------Read Service--------------//

export const getFullMenuByBranch = async (branchId) => {
    const menu = await prisma.branchMenuCategories.findMany({
        where: {branch_id: branchId},
        include:{
            items: {
                include: {
                    variants: true,
                },
                orderBy: {
                    name:'asc',
                },
            },
        },
    });
    if(!menu) throw new ApiError(400,"Category name is required");
    return menu;
}

export const createMenuCategory = async (branchId, name) => {
    if(!name) throw new ApiError(400, "Category name is required");
    return prisma.branchMenuCategories.create({
        data: {
            name,
            branch_id:branchId,
        },
    });
}

export const deleteMenuCategory = async (categoryId) => {
    
    return prisma.$transaction(async (tx) => {
        // 1. count how many menu items have the particular category assigned to them currently.
        const itemCount = await tx.branchMenuItems.count({
            where:{category_id:categoryId},
        });

        // 2. If the category is not empty, throw a conflict error.
        // This prevents the accidental deletion of menu items.
        if(itemCount > 0){
            throw new ApiError(409,`Cannot delete this category as it contains ${itemCount} menu item(s). Please move or delete the items first. `);
        }

        // 3. If the category is empty, it is safe to delete it.
        return tx.branchMenuCategories.delete({
            where:{id:categoryId},
        });
    })
}

export const updateMenuCategory = async (categoryId,name) =>{
    if(!name) throw new ApiError(400,"New category name is required");
    return prisma.branchMenuCategories.update({
        where: {id: categoryId},
        data: {name},
    });
}


// ---------Menu Items Service-----------//

export const addMenuItemtoCategory = async (categoryId, itemData) => {
    const {name, price, description, is_available} = itemData;
    if(!name || price === undefined) throw new ApiError(400,"Item name and price are required");
    return prisma.branchMenuItems.create({
        data: {
            name,
            price,
            description,
            is_available,
            category_id:categoryId,
        },
    });
}

export const updateMenuItem = async (itemId, itemData) => {
    // update the fields that are provided.
    return await prisma.branchMenuItems.update({
        where: {id : itemId},
        data: {itemData}
    })
}

export const toggleItemAvailability = async (itemId, is_available) => {
    if(is_available === undefined){
        throw new ApiError(400, "is_available flag (true/false) is required");
    }

    return await prisma.branchMenuItems.update({
        where:{id: itemId},
        data: {is_available},
    });
}

export const deleteMenuItem =  async (itemId) => {
    return await prisma.branchMenuItems.delete({
        where: {id : itemId}
    });
}




