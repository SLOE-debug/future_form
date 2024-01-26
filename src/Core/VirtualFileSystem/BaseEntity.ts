import { VritualFileSytem } from "@/Types/VirtualFileSystem";

type Entity = VritualFileSytem.BaseEntity;

export default abstract class BaseEntity implements Entity {
  abstract name: string;
  Delete() {
    console.log("删除成功！");
  }
}
