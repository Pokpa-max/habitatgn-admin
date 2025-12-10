// import { mutate } from "swr";

// export const mutateForAdd = (api, sectionName, newData, sectionId) => {
//     mutate(
//         api,
//         async (data) => {
//             if (!data) {
//                 return ([sectionName] = []);
//             }
//             return {
//                 [sectionName]: [{ id: sectionId, ...newData }, ...data[sectionName]],
//             };
//         },
//         false
//     );
// };
