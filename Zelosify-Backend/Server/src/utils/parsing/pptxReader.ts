import zlib from "zlib";

const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_FILE_HEADER = 0x02014b50;

const findEndOfCentralDirectory = (buffer: Buffer): number => {
  for (let offset = buffer.length - 22; offset >= 0; offset--) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY) {
      return offset;
    }
  }
  return -1;
};

const readFileData = (
  buffer: Buffer,
  localOffset: number,
  method: number,
  compressedSize: number
): string => {
  const nameLength = buffer.readUInt16LE(localOffset + 26);
  const extraLength = buffer.readUInt16LE(localOffset + 28);
  const start = localOffset + 30 + nameLength + extraLength;
  const data = buffer.subarray(start, start + compressedSize);

  if (method === 0) {
    return data.toString("utf8");
  }

  return zlib.inflateRawSync(data).toString("utf8");
};

const decodeEntities = (value: string): string =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");

const readSlideText = (xml: string): string => {
  const matches = xml.match(/<a:t>[\s\S]*?<\/a:t>/g) || [];
  return matches
    .map((tag) => decodeEntities(tag.replace(/<\/?a:t>/g, "")))
    .join(" ");
};

export const extractTextFromPptx = (buffer: Buffer): string => {
  const eocdOffset = findEndOfCentralDirectory(buffer);

  if (eocdOffset < 0) {
    throw new Error("Unsupported or corrupted PPTX file");
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  let offset = buffer.readUInt32LE(eocdOffset + 16);
  const slides: string[] = [];

  for (let index = 0; index < entryCount; index++) {
    if (offset + 46 > buffer.length) break;
    if (buffer.readUInt32LE(offset) !== CENTRAL_FILE_HEADER) break;

    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString(
      "utf8",
      offset + 46,
      offset + 46 + nameLength
    );

    const isSlide =
      name.startsWith("ppt/slides/slide") && name.endsWith(".xml");
    const isNotes =
      name.startsWith("ppt/notesSlides/notesSlide") && name.endsWith(".xml");

    if (isSlide || isNotes) {
      slides.push(
        readSlideText(readFileData(buffer, localOffset, method, compressedSize))
      );
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return slides.join("\n").trim();
};
