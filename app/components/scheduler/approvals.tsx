import { type User } from '~/auth/auth.server';

import { type Approval } from '~/services/scheduler/approvals.server';

import { Tooltip, TooltipLevel } from '~/components';
import classnames from '~/helpers/classnames';

export const ApprovalsSummary = ({ approvals, user }: { approvals: Array<Approval>, user: User }) => {
  const approved = approvals.filter(a => a.status === "approved");
  const forUser = approvals.filter(a => a.userId === user.id && a.status === "draft");

  const message = approvals.length === 0 
    ? "No configured approvals" 
    : forUser.length === 0 ? "You have no pending approvals" : undefined;
  const level = approvals.length === 0 
    ? TooltipLevel.Error 
    : forUser.length === 0 ? TooltipLevel.Warning : TooltipLevel.Info;
  const details = approvals.length === 0 
    ? "error" : `${approved.length} / ${approvals.length}`;

  return (
    <Tooltip text={message} level={level}>
      <span className={classnames(
          forUser.length === 0 ? "opacity-50" : "",
          approvals.length === 0 ? "text-red-700" : "")}>
        {details}
      </span>
    </Tooltip>
  );
};