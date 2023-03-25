import paths from "@/routes/paths";

export default () => <div />;

export function getServerSideProps() {
  return {
    redirect: {
      destination: paths.LOGIN,
      permanent: true,
    },
  };
}
