import { Error } from '~/pages';
import { useUser } from '~/hooks';

export default (permission: string) => (Component: any) => (props: any) => {
  const user = useUser();
 
  if (user.permissions.includes(permission) || permission === undefined) 
    return <Component {...props} />

  return <Error message="Access Denied" code={403} />;
};
