import { Project } from "./Project"

export type Definition = {
    drafts: object[],
    id: number,
    name: string,
    url: string,
    uri: string,
    path: string,
    type: string,
    queueState: string,
    revision: number,
    project: Project

}
