import { expect } from "chai";
import cleanDb from "../../utils/cleanDb";
import { createRequest, getRequests, updateRequest } from "../../../models/requests";
import {
  createOooRequests,
  createOooRequests2,
  createOooStatusRequests,
  updateOooApprovedRequests,
  updateOooRejectedRequests,
} from "./../../fixtures/oooRequest/oooRequest";
import { REQUEST_ALREADY_PENDING, REQUEST_STATE, REQUEST_TYPE } from "../../../constants/requests";

describe("models/oooRequests", () => {
  afterEach(async () => {
    await cleanDb();
  });

  describe("createRequest", () => {
    it("should successfully create a new OOO request", async () => {
      const oooRequest = await createRequest(createOooStatusRequests);
      expect(oooRequest).to.not.be.null;
      expect(oooRequest).to.have.property("id");
      expect(oooRequest).to.have.property("requestedBy");
    });

    it("should throw an error if the user already has an OOO request", async () => {
      await createRequest(createOooStatusRequests);
      try {
        await createRequest(createOooStatusRequests);
        expect.fail("User already has an OOO request");
      } catch (error) {
        expect(error.message).to.equal("User already has an OOO request");
      }
    });

    it("should throw an error if the user already has an OOO request", async () => {
      await createRequest(createOooStatusRequests);
      const oooRequest = await createRequest(createOooStatusRequests);
      expect(oooRequest).to.not.be.null;
      expect(oooRequest.error).to.equal(REQUEST_ALREADY_PENDING);
    });
  });

  describe("updateRequest", () => {
    it("should update an existing OOO request", async () => {
      const oooRequest: any = await createRequest(createOooStatusRequests);
      const updatedOooRequest: any = await updateRequest(
        oooRequest.id,
        updateOooApprovedRequests,
        updateOooApprovedRequests.lastModifiedBy
      );
      expect(updatedOooRequest).to.not.be.null;
      expect(updatedOooRequest).to.have.property("state");
      expect(updatedOooRequest.state).to.equal(updateOooApprovedRequests.state);
    });

    it("should throw an error if the OOO request does not exist", async () => {
      try {
        await updateRequest("randomId", updateOooApprovedRequests, updateOooApprovedRequests.lastModifiedBy);
        expect.fail("OOO request does not exist");
      } catch (error) {
        expect(error.message).to.equal("OOO request does not exist");
      }
    });

    it("should throw an error if the OOO request is already approved", async () => {
      const oooRequest: any = await createRequest(createOooStatusRequests);
      await updateRequest(oooRequest.id, updateOooApprovedRequests, updateOooApprovedRequests.lastModifiedBy);
      try {
        await updateRequest(oooRequest.id, updateOooApprovedRequests, updateOooApprovedRequests.lastModifiedBy);
        expect.fail("OOO request is already approved");
      } catch (error) {
        expect(error.message).to.equal("OOO request is already approved");
      }
    });

    it("should throw an error if the OOO request is already rejected", async () => {
      const oooRequest: any = await createRequest(createOooStatusRequests);
      await updateRequest(oooRequest.id, updateOooRejectedRequests, updateOooRejectedRequests.lastModifiedBy);
      try {
        await updateRequest(oooRequest.id, updateOooApprovedRequests, updateOooApprovedRequests.lastModifiedBy);
        expect.fail("OOO request is already rejected");
      } catch (error) {
        expect(error.message).to.equal("OOO request is already rejected");
      }
    });
  });

  describe("getRequests", () => {
    it("Should return the request with the specified ID", async () => {
      const oooRequest = await createRequest(createOooRequests2);
      const query = { id: oooRequest.id, dev: "true" };
      const oooRequestData:any = await getRequests(query);
      expect(oooRequestData).to.have.property("id");
      expect(oooRequestData.id).to.be.equal(oooRequest.id);
    });

    it("Should return a list of all the GET requests", async () => {
      await createRequest(createOooRequests);
      await createRequest(createOooRequests2);
      const query = { dev: "true" };
      const oooRequestData = await getRequests(query);
      expect(oooRequestData).to.be.have.length(2);
    });

    it("Should return a list of all the requests with specified state - APPROVED", async () => {
      const oooRequest: any = await createRequest(createOooStatusRequests);
      await updateRequest(oooRequest.id, updateOooApprovedRequests, updateOooApprovedRequests.lastModifiedBy);
      const query = { dev: "true", state: REQUEST_STATE.APPROVED };
      const oooRequestData = await getRequests(query);
      expect(oooRequestData[0].state).to.be.equal(REQUEST_STATE.APPROVED);
    });

    it("Should return a list of all the requests with specified state - PENDING", async () => {
      await createRequest(createOooStatusRequests);
      const query = { dev: "true", state: REQUEST_STATE.PENDING };
      const oooRequestData = await getRequests(query);
      expect(oooRequestData[0].state).to.be.equal(REQUEST_STATE.PENDING);
    });

    it("Should return a list of all the requests by specific user ", async () => {
      const oooRequest = await createRequest(createOooRequests);
      const query = { dev: "true", requestedBy: oooRequest.requestedBy };
      const oooRequestData = await getRequests(query);
      expect(oooRequestData).to.have.lengthOf(1);
      expect(oooRequestData[0].requestedBy).to.be.equal(oooRequest.requestedBy);
    });

    it("Should return a list of all the requests for specific type ", async () => {
      await createRequest(createOooRequests);
      const query = { dev: "true", type: REQUEST_TYPE.OOO };
      const oooRequestData = await getRequests(query);
      expect(oooRequestData).to.have.lengthOf(1);
      expect(oooRequestData[0].type).to.be.equal(REQUEST_TYPE.OOO);
    });

    it("Should return empty array if no data is found", async () => {
      const query = { dev: "true", state: REQUEST_STATE.PENDING };
      const oooRequestData = await getRequests(query);
      expect(oooRequestData).to.be.equal(null);
    });
  });
});
