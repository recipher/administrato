import ExcelJS, { type Worksheet } from 'exceljs';
import fs from 'node:fs/promises';

const Service = () => {
  const addLogo = async (worksheet: Worksheet) => {
    const logo = worksheet.workbook.addImage({
      buffer: await fs.readFile(`${process.cwd()}/../public/images/sgg-logo.png`),
      extension: 'png',
    });

    worksheet.addImage(logo, 'D3:E5');
  };

  const generate = async () => {
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet('schedule');

    await addLogo(sheet);

    return workbook;
  };

  return { generate };
};

export default Service;