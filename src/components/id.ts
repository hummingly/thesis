let ID = 0;
export function getId() {
    const id = ID;
    ID += 1;
    return id;
}