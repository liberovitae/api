import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { createWriteStream, existsSync, mkdirSync } from 'fs';

export default {
  Mutation: {
    uploadFile: async (_, { file }) => {
      try {
        const { createReadStream, filename } = await file;
        const uuidFile = `${uuidv4()}${path.parse(filename).ext}`;

        existsSync(path.join(__dirname, '../../images')) ||
          mkdirSync(path.join(__dirname, '../../images'));

        await new Promise((resolve, reject) =>
          createReadStream()
            .pipe(
              createWriteStream(
                path.join(__dirname, '../../images', uuidFile),
              ),
            )
            .on('close', resolve),
        ).catch((err) => console.log(err));

        return `${process.env.API_URL}/images/${uuidFile}`;
      } catch (err) {
        console.log(err);
      }
    },
  },
};
