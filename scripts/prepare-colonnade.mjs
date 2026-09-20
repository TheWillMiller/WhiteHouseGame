// Official White House gallery, kept locally in a single atlas for low draw-call cost.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const html=await readFile('.qa/references/walk-of-fame.html','utf8');
const people=[...html.matchAll(/\{ n:(\d+), name:"([^"]+)", years:"([^"]+)"/g)].map(m=>({number:+m[1],name:m[2],years:m[3]}));
if(people.length!==47)throw Error('Expected 47 verified gallery entries');
await mkdir('public/art',{recursive:true});
const composite=[];let next=0;
await Promise.all(Array.from({length:4},async()=>{while(next<47){const i=next++,url=`https://www.whitehouse.gov/wp-content/uploads/2026/06/p${String(i+1).padStart(2,'0')}.png`;
 const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${url}`);
 const input=await sharp(Buffer.from(await response.arrayBuffer())).trim().resize(248,308,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 composite.push({input,left:(i%8)*256+4,top:Math.floor(i/8)*320+6});
}}));
await sharp({create:{width:2048,height:1920,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composite).webp({quality:84}).toFile('public/art/colonnade-portraits.webp');
await writeFile('lib/colonnade-people.ts',`// Names and terms from the official White House gallery; plaque biographies are not reproduced.\nexport const COLONNADE_PEOPLE=${JSON.stringify(people)} as const;\n`);
await writeFile('public/art/colonnade-credits.txt','Presidential Walk of Fame gallery portraits\nSource: https://www.whitehouse.gov/walk-of-fame/\nImages: https://www.whitehouse.gov/wp-content/uploads/2026/06/p01.png through p47.png\nAccessed September 20, 2026. Official U.S. government gallery photographs, including historic portrait reproductions. Resized into one texture atlas. No endorsement implied.\nThe game nameplates give names and terms; they do not reproduce the exhibition\'s biographical commentary.\n');
console.log('Prepared 47 official gallery portraits in one atlas.');
