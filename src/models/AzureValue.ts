import { Definition } from "./Definition";
import { LastChangedBy } from "./LastChangedBy";
import { Links } from "./Links"
import { Logs } from "./Logs";
import { OrchestrationPlan } from "./OrchestrationPlan";
import { Plan } from "./Plan";
import { Project } from "./Project";
import { Properties } from "./Properties";
import { Queue } from "./Queue";
import { Repository } from "./Repository";
import { RequestedBy } from "./RequestedBy";
import { RequestedFor } from "./RequestedFor";
import { TriggerInfo } from "./TriggerInfo";

export type AzureValue = {
    links: Links;
    properties: Properties;
    tags: object[];
    validationResults: object[];
    plans: Plan[];
    triggerInfo: TriggerInfo;
    id: number;
    buildNumber: string;
    status: string;
    result: string;
    queueTime: Date;
    startTime: Date;
    finishTime: Date;
    url: string;
    definition: Definition;
    buildNumberRevision: number;
    project: Project;
    uri: string;
    sourceBranch: string;
    sourceVersion: string;
    queue: Queue;
    priority: string;
    reason: string;
    requestedFor: RequestedFor;
    requestedBy: RequestedBy;
    lastChangedDate: Date;
    lastChangedBy: LastChangedBy;
    orchestrationPlan: OrchestrationPlan;
    logs: Logs;
    repository: Repository;
    keepForever: boolean;
    retainedByRelease: boolean;
    triggeredByBuild: object;


}
