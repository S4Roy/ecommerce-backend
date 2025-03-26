import stream from "stream";
import { awsService } from "../index.js";

const S3 = new awsService.AWS.S3();

class S3Handler {
  constructor() {}

  readStream({ bucket, key }) {
    return S3.getObject({ Bucket: bucket, Key: key }).createReadStream();
  }

  async checkKey({ bucket, key }) {
    try {
      const data = await S3.headObject({ Bucket: bucket, Key: key }).promise();
      console.log("Key was", data);
      return true;
    } catch (error) {
      console.log("error return a object with status code 404");
      return false;
    }
  }

  writeStream({ bucket, key, contentType }) {
    const passThrough = new stream.PassThrough();
    return {
      writeStream: passThrough,
      uploaded: S3.upload({
        ContentType: `${contentType}`,
        Body: passThrough,
        Bucket: bucket,
        Key: key,
        ACL: "public-read",
      }).promise(),
    };
  }
}

export const s3Handler = new S3Handler();
