export const kmp = (str1, str2) => {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    const sz = str1.length;
    str1 = str1 + "#" + str2;
    const n = str1.length;
    const lps = new Array(n).fill(0);

    for (let i = 1; i < n; i++) {
        let x = lps[i - 1];
        while (str1[i] !== str1[x]) {
            if (x === 0) {
                x = -1;
                break;
            }
            x = lps[x - 1];
        }
        if (x + 1 === sz) {
            return true;
        }
        lps[i] = x + 1;
    }
    return false;
}
