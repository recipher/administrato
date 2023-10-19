const permissions = {
  manage: {
    read: {
      legalEntity: "manage:read:legal-entity",
      provider: "manage:read:provider",
      client: "manage:read:client",
      person: "manage:read:person",
      securityGroup: "manage:read:security-group",
    },
    create: {
      legalEntity: "manage:create:legal-entity",
      provider: "manage:create:provider",
      client: "manage:create:client",
      person: "manage:create:person",
      securityGroup: "manage:create:security-group",
    },
    edit: {
      legalEntity: "manage:edit:legal-entity",
      provider: "manage:edit:provider",
      client: "manage:edit:client",
      person: "manage:edit:person",
      securityGroup: "manage:edit:security-group",
    },
    delete: {
      legalEntity: "manage:delete:legal-entity",
      provider: "manage:delete:provider",
      client: "manage:delete:client",
      person: "manage:delete:person",
      securityGroup: "manage:delete:security-group",
    },
  },
  scheduler: {
    read: {
      country: "scheduler:read:country",
      holiday: "scheduler:read:holiday",
      milestone: "scheduler:read:milestone",
      schedule: "scheduler:read:schedule",
    },
    create: {
      country: "scheduler:create:country",
      holiday: "scheduler:create:holiday",
      milestone: "scheduler:create:milestone",
      schedule: "scheduler:create:schedule",
    },
    edit: {
      country: "scheduler:edit:country",
      holiday: "scheduler:edit:holiday",
      milestone: "scheduler:edit:milestone",
      schedule: "scheduler:edit:schedule",
    },
    delete: {
      country: "scheduler:delete:country",
      holiday: "scheduler:delete:holiday",
      milestone: "scheduler:delete:milestone",
      schedule: "scheduler:delete:schedule",
    },
  },
  security: {
    read: {
      user: "security:read:user",
      role: "security:read:role",
    },
    create: {
      user: "security:create:user",
      role: "security:create:role",
    },
    edit: {
      user: "security:edit:user",
      role: "security:edit:role",
    },
    delete: {
      user: "security:delete:user",
      role: "security:delete:role",
    },
  }
};

export const manage = permissions.manage;
export const scheduler = permissions.scheduler;
export const security = permissions.security;

export default permissions;