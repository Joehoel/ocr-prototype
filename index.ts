import { createWorker, ImageLike, OEM, PSM } from "tesseract.js";
import { Configuration, OpenAIApi } from "openai";
import { writeFile } from "fs/promises";
import "dotenv/config";

const getTextFromImage = async (
  image: ImageLike,
  oem: OEM = OEM.DEFAULT,
  psm: PSM = PSM.AUTO,
  languages: string = "nld+osd"
): Promise<string | null> => {
  const worker = await createWorker();

  await worker.loadLanguage(languages);
  await worker.initialize(languages);
  await worker.setParameters({
    tessedit_ocr_engine_mode: oem,
    tessedit_pageseg_mode: psm,
  });

  const {
    data: { text },
  } = await worker.recognize(image);

  return text;
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function main() {
  const text = await getTextFromImage("./images/contacts.png");

  const { data } = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Extract all names from the following text: ${text}`,
    temperature: 0,
    max_tokens: 500,
  });

  await writeFile(`./output/openai-${Date.now()}.json`, JSON.stringify(data, null, 2));

  const names = data.choices[0].text
    ?.split(", ")
    .filter(name => name)
    .map(name => name.trim());

  console.log(names);
}

main();
