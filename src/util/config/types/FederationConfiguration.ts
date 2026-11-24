export class FederationRegistryConfiguration {
    url: string = "";
    publicKey: string = "";
}

export class FederationDiscoveryConfiguration {
    verification: "registry" | "instance" = "registry";
}

export class FederationMediaConfiguration {
    cacheSize: number = 64 * 1024 * 1024;
    maxFileSize: number = 50 * 1024 * 1024;
    cacheSeconds: number = 60 * 60;
    requestsPerMinute: number = 600;
}

export class FederationLimitsConfiguration {
    objectsPerInstance: number = 200_000;
    shadowsPerInstance: number = 50_000;
    guildsPerInstance: number = 500;
    inboxEventsPerInstance: number = 200_000;
    newObjectsPerRequest: number = 10_000;
}

export class FederationConfiguration {
    enabled: boolean = false;
    registry: FederationRegistryConfiguration = new FederationRegistryConfiguration();
    announce: boolean = false;
    announceStats: boolean = false;
    allowUnlistedPeers: boolean = false;
    peers: string[] = [];
    contacts: string[] = [];
    previousIds: string[] = [];
    discovery: FederationDiscoveryConfiguration = new FederationDiscoveryConfiguration();
    media: FederationMediaConfiguration = new FederationMediaConfiguration();
    limits: FederationLimitsConfiguration = new FederationLimitsConfiguration();
}
