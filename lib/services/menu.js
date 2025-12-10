import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from '@/lib/firebase/client_config'
import { parseDocsData } from '@/utils/firebase/firestore'


export const menusCollectionRef = (restaurantId) => collection(db, `menus/${restaurantId}/menus`);
export const generatedSectionsCollectionRef = (restaurantId) => collection(db, `menus/${restaurantId}/generatedSection`);
export const generalMenuDocRef = (restaurantId) => doc(db, `menus/${restaurantId}`);

export const getMenus = (restaurantId, setState) => {
    return onSnapshot(menusCollectionRef(restaurantId), (querySnapshot) => {
        const menus = parseDocsData(querySnapshot);
        setState(menus);
    })
}




export const getSelectedMenu = async (restaurantId, unActiveMenuId) => {
    const onSnapshot = await getDoc(generalMenuDocRef(restaurantId));
    const data = { ...onSnapshot.data() };

    const menuId = unActiveMenuId ? unActiveMenuId : data.id
    const menuSections = await getGeneratedSectionsByMenuId(restaurantId, menuId);
    const menu = { ...data, menuSections, menuId }

    return menu
}


export const getGeneratedSectionsByMenuId = async (restaurantId, menuId) => {


    const q = query(generatedSectionsCollectionRef(restaurantId),
        where('menusIds', 'array-contains', menuId), orderBy('position', 'asc')
    )
    const snapshot = await getDocs(q);
    return parseDocsData(snapshot);
}