import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import Card from "@/components/ui/Card";
import Link from "next/link";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";

const YourSociety = ({ organisation, societies, context, session, meta }) => {
  const t = useTranslations();
  const router = useRouter();
  const globalDispatch = useGlobalDispatch();
  const [organisationList, setOrganisationList] = useState([
    {
      id: 1,
      short_name: "organisation23",
      contact_address: "sdfkashf",
      contact_website: "sfsa",
    },
  ]);

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, [organisation]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Yours Society" />
      <div className="row mt-5">
        {organisationList.map((item) => {
          return (
            <div className="col-md-3">
              <Card
                title={
                  <>
                    &nbsp;
                    <Icon icon="user" />
                    &nbsp;
                    {item.short_name}
                  </>
                }
                description={
                  <>
                    &nbsp;
                    <Icon icon="exclamation-circle" />
                    &nbsp;{item.contact_address}
                  </>
                }
              >
                {" "}
                <Icon icon="windows" />
                <p>{item.contact_website}</p>
                <Link href={`/organisations/${item.id}`}>
                  <Button color="success">Join Here</Button>
                </Link>
              </Card>
            </div>
          );
        })}
      </div>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const organisationResponse = await api({
        url: `/organisations/${context.query.organisationId}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          organisation: organisationResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

YourSociety.authorized = true;
YourSociety.Layout = DashboardLayout;
YourSociety.defaultProps = {
  societies: [],
};

export default YourSociety;
