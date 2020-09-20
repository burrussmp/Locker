import chai from "chai";
import chaiHttp from "chai-http";
import { app } from "../../server/server";
import { UserData } from "../../development/user.data";
import { PostData } from "../../development/post.data";
import User from "../../server/models/user.model";
import Media from "../../server/models/media.model";
import Post from "../../server/models/post.model";
import StaticStrings from "../../config/StaticStrings";
const fs = require("fs").promises;
import S3_Services from "../../server/services/S3.services";
import fetch from "node-fetch";
import { drop_database, buffer_equality, createUser } from "../helper";
import _ from "lodash";
import permissions from "../../server/permissions";

chai.use(chaiHttp);
chai.should();

let image1 = process.cwd() + "/test/resources/profile1.png";
let video = process.cwd() + "/test/resources/sample_vid.mp4";

const media_test_basics = () => {
  describe("Media test basics", () => {
    describe("GET avatar basics (testing size query parameter) and using /api/users/:userID/avatar", () => {
      let userId0, Key;
      let agent = chai.request.agent(app);
      let userToken0;
      before(async () => {
        await drop_database();
        let user = await createUser(UserData[0]);
        userId0 = user._id;
        userToken0 = user.access_token;
        await agent
          .post(`/api/users/${userId0}/avatar?access_token=${userToken0}`)
          .attach("media", image1);

        let medias = await Media.find();
        medias.length.should.eql(1);
        Key = medias[0].key;
      });
      after(async () => {
        await drop_database();
      });
      it("GET profile photo", async () => {
        return fetch(
          `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}`
        )
          .then((res) => res.blob())
          .then(async (res) => {
            let buffer = await res.arrayBuffer();
            return fs.readFile(image1).then((data) => {
              buffer_equality(data, buffer).should.be.true;
            });
          });
      });
      it("Adjust the size of the profile to small for /api/users/:userId/avatar", async () => {
        return fetch(
          `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=small`
        ).then(async (res) => {
          res.status.should.eql(200);
          let media = await Media.findOne({ key: Key });
          media.resized_keys.length.should.eql(1);
          let resized_media = media.resized_keys[0];
          await S3_Services.fileExistsS3(Key);
          await S3_Services.fileExistsS3(resized_media);
        });
      });
      it("Adjust the size of the profile to medium for /api/users/:userId/avatar", async () => {
        return fetch(
          `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=medium`
        ).then(async (res) => {
          res.status.should.eql(200);
          let media = await Media.findOne({ key: Key });
          media.resized_keys.length.should.eql(2);
        });
      });
      it("Adjust the size of the profile to large for /api/users/:userId/avatar", async () => {
        return fetch(
          `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=large`
        ).then(async (res) => {
          res.status.should.eql(200);
          let media = await Media.findOne({ key: Key });
          media.resized_keys.length.should.eql(3);
        });
      });
      it("Adjust the size of the profile to xlarge for /api/users/:userId/avatar", async () => {
        return fetch(
          `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=xlarge`
        ).then(async (res) => {
          res.status.should.eql(200);
          let media = await Media.findOne({ key: Key });
          media.resized_keys.length.should.eql(4);
        });
      });
      it("Query parameter 'media_type' should have no affect for /api/users/:userId/avatar", async () => {
        return fetch(
          `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=xlarge&media_type=ContentType`
        ).then(async (res) => {
          res.status.should.eql(200);
          let media = await Media.findOne({ key: Key });
          media.resized_keys.length.should.eql(4);
          let listS3 = await S3_Services.listObjectsS3();
          listS3.Contents.length.should.eql(5);
        });
      });
      it("Update profile (should remove all in S3 but one i.e. one we just updated) for /api/users/:userId/avatar", async () => {
        await agent
          .post(`/api/users/${userId0}/avatar?access_token=${userToken0}`)
          .attach("media", image1);
        return fetch(
          `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}`
        ).then(async (res) => {
          res.status.should.eql(200);
          let listS3 = await S3_Services.listObjectsS3();
          listS3.Contents.length.should.eql(1);
          let medias = await Media.find();
          medias.length.should.eql(1);
          Key = medias[0].key;
        });
      });
      it("Incorrect query parameter 'size' should fail for /api/users/:userId/avatar", async () => {
        return fetch(
          `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=BAD`
        ).then(async (res) => {
          res.status.should.eql(400);
          let body = await res.json();
          body.error.should.eql(
            StaticStrings.MediaControllerErrors.SizeQueryParameterInvalid
          );
        });
      });
      it("Incorrect query parameter 'size' should fail for /api/media/", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=BAD&media_type=Avatar`
        ).then(async (res) => {
          res.status.should.eql(400);
          let body = await res.json();
          body.error.should.eql(
            StaticStrings.MediaControllerErrors.SizeQueryParameterInvalid
          );
          let listS3 = await S3_Services.listObjectsS3();
          listS3.Contents.length.should.eql(1);
        });
      });
      it("Incorrect query parameter 'media_type' should fail for /api/media/", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=small&media_type=BAD`
        ).then(async (res) => {
          res.status.should.eql(400);
          let body = await res.json();
          body.error.should.eql(
            StaticStrings.MediaControllerErrors.MediaTypeQueryParameterInvalid
          );
          let listS3 = await S3_Services.listObjectsS3();
          listS3.Contents.length.should.eql(1);
        });
      });
      it("Query parameter 'media_type' doesn't match the meta data in S3 for /api/media/", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=small&media_type=ContentPost`
        ).then(async (res) => {
          res.status.should.eql(400);
          let body = await res.json();
          body.error.should.eql(
            StaticStrings.MediaControllerErrors.MediaTypeDoesntMatchMetaData
          );
          let listS3 = await S3_Services.listObjectsS3();
          listS3.Contents.length.should.eql(1);
        });
      });
      it("Missing query parameter 'media_type' for /api/media/", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=small`
        ).then(async (res) => {
          res.status.should.eql(400);
          let body = await res.json();
          body.error.should.eql(
            StaticStrings.MediaControllerErrors.MediaTypeQueryParameterInvalid
          );
          let listS3 = await S3_Services.listObjectsS3();
          listS3.Contents.length.should.eql(1);
        });
      });
      it("Missing query parameter 'size' for /api/media/ should return normal image and work", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&media_type=Avatar`
        ).then(async (res) => {
          res.status.should.eql(200);
          let listS3 = await S3_Services.listObjectsS3();
          listS3.Contents.length.should.eql(1);
        });
      });
      it("Adjust the size of the profile to small for /api/media/", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=small&media_type=Avatar`
        ).then(async (res) => {
          res.status.should.eql(200);
          let media = await Media.findOne({ key: Key });
          media.resized_keys.length.should.eql(1);
          let resized_media = media.resized_keys[0];
          await S3_Services.fileExistsS3(Key);
          await S3_Services.fileExistsS3(resized_media);
        });
      });
      it("Adjust the size of the profile to medium for /api/media/", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=medium&media_type=Avatar`
        ).then(async (res) => {
          res.status.should.eql(200);
          let media = await Media.findOne({ key: Key });
          media.resized_keys.length.should.eql(2);
        });
      });
      it("Adjust the size of the profile to large for /api/media/", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=large&media_type=Avatar`
        ).then(async (res) => {
          res.status.should.eql(200);
          let media = await Media.findOne({ key: Key });
          media.resized_keys.length.should.eql(3);
        });
      });
      it("Adjust the size of the profile to xlarge for /api/media/", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=xlarge&media_type=Avatar`
        ).then(async (res) => {
          res.status.should.eql(200);
          let media = await Media.findOne({ key: Key });
          media.resized_keys.length.should.eql(4);
        });
      });
    });
    describe("GET Content Post media", () => {
      let userId0, Key, Key2;
      let agent = chai.request.agent(app);
      let userToken0;
      before(async () => {
        await drop_database();
        let user = await createUser(UserData[0]);
        userId0 = user._id;
        userToken0 = user.access_token;
        await agent
          .post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
          .attach("media", image1)
          .field(PostData[0])
          .then(async (res) => {
            await agent
              .get(`/api/posts/${res.body._id}?access_token=${userToken0}`)
              .then((res) => {
                Key = res.body.content.media.key;
              });
          });
        await agent
          .post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
          .attach("media", video)
          .field(PostData[0])
          .then(async (res) => {
            await agent
              .get(`/api/posts/${res.body._id}?access_token=${userToken0}`)
              .then((res) => {
                Key2 = res.body.content.media.key;
              });
          });
      });
      after(async () => {
        await drop_database();
      });
      it("See if you can get an image w/out any query parameters (should be fine)", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}`
        ).then(async (res) => {
          res.status.should.eql(200);
        });
      });
      it("See if you can get a video w/out any query parameters (should be fine)", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key2}?access_token=${userToken0}`
        ).then(async (res) => {
          res.status.should.eql(200);
        });
      });
      it("Try to resize a non-image (should fail)", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key2}?access_token=${userToken0}&size=small&media_type=ContentPost`
        ).then(async (res) => {
          res.status.should.eql(400);
          let body = await res.json();
          body.error.should.eql(
            StaticStrings.MediaControllerErrors.CannotResizeNotImage
          );
          let listS3 = await S3_Services.listObjectsS3();
          listS3.Contents.length.should.eql(2);
        });
      });
      it("Try to resize an image (should be fine)", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=small&media_type=ContentPost`
        ).then(async (res) => {
          res.status.should.eql(200);
          let listS3 = await S3_Services.listObjectsS3();
          listS3.Contents.length.should.eql(3);
        });
      });
      it("Missing size query parameter (should be fine)", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&media_type=ContentPost`
        ).then(async (res) => {
          res.status.should.eql(200);
          let listS3 = await S3_Services.listObjectsS3();
          listS3.Contents.length.should.eql(3);
        });
      });
      it("Missing media_type query parameter but trying to resize (should fail)", async () => {
        return fetch(
          `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=small`
        ).then(async (res) => {
          res.status.should.eql(400);
          let body = await res.json();
          body.error.should.eql(
            StaticStrings.MediaControllerErrors.MediaTypeQueryParameterInvalid
          );
        });
      });
    });
  });
};

export default media_test_basics;
