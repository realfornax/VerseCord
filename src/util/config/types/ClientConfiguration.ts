export const DEFAULT_INSTANCE_NAME = "VerseCord";

export class ClientConfiguration {
    useTestClient: boolean = true;
    shopEnabled: boolean = true;
    instanceName: string = DEFAULT_INSTANCE_NAME;
    icon: string | null = null;
    logo: string | null = null;
    helpUrl: string | null = null;
    activityApplicationHost: string | null = null;
    loadingTips: string[] | null = null;
    loadingSvg: string | null = null;
    experiments: Record<string, number> = {};
    userExperiments: Record<string, Record<string, number>> = {};
    guildExperiments: Record<string, Record<string, number>> = {};
    rolloutExperiments: Record<string, { percent: number; variant: number }> = {};
}
