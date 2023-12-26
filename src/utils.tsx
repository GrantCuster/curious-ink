export function extractAndParse(result: string) {
  const extracted = extractTextBetweenBackticks(result);
  const parsed = JSON.parse(extracted[0]);
  return parsed;
}

export function extractTextBetweenBackticks(inputString: string) {
  const regex = /```json([\s\S]+?)```/g;
  const matches = [];
  let match;

  while ((match = regex.exec(inputString)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

export const timeStampToSeconds = (timeStamp: string) => {
  const splits = timeStamp.split(":");
  const seconds = parseInt(splits[0]) * 60 + parseInt(splits[1]);
  return seconds;
};

export function cosinesim(A: Array<number>, B: Array<number>) {
  let dotproduct = 0;
  let mA = 0;
  let mB = 0;

  for (let i = 0; i < A.length; i++) {
    dotproduct += A[i] * B[i];
    mA += A[i] * A[i];
    mB += B[i] * B[i];
  }

  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  const similarity = dotproduct / (mA * mB);

  return similarity;
}

export function euclideanDistance(a: Array<number>, b: Array<number>) {
  return Math.hypot(...a.map((k, i) => b[i] - k));
}

export function htmlDecode(input: string) {
  const e = document.createElement("div");
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function vectorSubtract(vectorA: number[], vectorB: number[]) {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must be of the same length");
  }
  return vectorA.map((element, index) => element - vectorB[index]);
}

export function getVectorNorm(vector: number[]): number {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

export function dotProduct(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must be of the same length");
  }

  let product = 0;
  for (let i = 0; i < vectorA.length; i++) {
    product += vectorA[i] * vectorB[i];
  }

  return product;
}

function getOrdinalSuffix(day: number) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatAMPM(date: Date) {
  let hours = date.getHours();
  let minutes: string | number = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  return hours + ":" + minutes + ampm;
}

export function printCurrentTime() {
  const now = new Date();
  const dayName = now.toLocaleString("en-us", { weekday: "long" });
  const monthName = now.toLocaleString("en-us", { month: "long" });
  const day = now.getDate();
  const ordinalSuffix = getOrdinalSuffix(day);
  const time = formatAMPM(now);
  return dayName + ", " + monthName + " " + day + ordinalSuffix + ", " + time;
}
