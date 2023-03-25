import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { capitalize, compact } from "lodash";
import FadeIn from "react-fade-in";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import Pill from "@/components/ui/Pill";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import apiPaths from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import localizeDate from "@/utils/localizeDate";
import EmailModal from "@/components/modals/EmailModal";
import omit from "lodash/omit";
import isPlainObject from "lodash/isPlainObject";
import ScheduleSendModal from "@/components/modals/ScheduleSendModal";
import formatISO from "date-fns/formatISO";
import SaveAsTemplateModal from "@/components/modals/SaveAsTemplateModal";
import { useToasts } from "react-toast-notifications";
import { SCHEDULED, SENT } from "@/constants/communicationStatus";

const CampaignList = ({ campaigns, event }) => {
  const t = useTranslations();

  const labelColors = {
    sent: "green",
    error: "danger",
    draft: "default",
    sending: "info",
    scheduled: "default",
  };

  const campaignStats = [
    {
      key: "opened_emails",
      label: t("common.openedEmail", { entries: 2 }),
      color: "success",
    },
    {
      key: "received_emails",
      label: t("common.receivedEmail", { entries: 2 }),
      color: "info",
    },
    {
      key: "draft_emails",
      label: t("common.draftEmail", { entries: 2 }),
      color: "secondary",
    },
    {
      key: "bounced_emails",
      label: t("common.bouncedEmail", { entries: 2 }),
      color: "danger",
    },
  ];

  return (
    <FadeIn>
      <ul className="result-list mt-3">
        {campaigns.map((campaign) => {
          const localizedDateAndTime = localizeDate(campaign?.date_added, {
            withTime: true,
          });
          const localizedDate = localizeDate(campaign?.date_added);
          const localizedTime = localizeDate(campaign?.date_added, {
            timeOnly: true,
          });
          const senderFullname = campaign?.from
            ? t("common.byEntity", {
                entity: `${campaign?.from?.first_name} ${campaign?.from?.last_name}`,
              })
            : null;

          return (
            <li>
              <div className="result-info">
                <h4 className="title">
                  <Link
                    href={{
                      pathname: paths.ADMIN_EVT_COMMUNICATIONS_DASHBOARD,
                      query: {
                        eventId: event.id,
                        communicationId: campaign?.id,
                      },
                    }}
                  >
                    <a>{campaign?.name}</a>
                  </Link>
                  <Pill
                    size="sm"
                    color={labelColors[campaign?.status]}
                    className="pull-right"
                  >
                    {capitalize(campaign?.status)}{" "}
                    {(campaign?.status === SENT && localizedTime) || null}
                    {(campaign?.status === SCHEDULED &&
                      `on ${localizedDateAndTime}`) ||
                      null}
                  </Pill>
                </h4>
                <p className="location">
                  {compact([senderFullname, localizedDate]).join()}
                </p>
                <div>
                  {campaignStats.map((stat) => (
                    <Pill color={stat.color} className="mr-2">{`${
                      campaign?.[stat.key] || 0
                    } ${stat.label}`}</Pill>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </FadeIn>
  );
};

const CommunicationsPage = ({ event, context, session }) => {
  const router = useRouter();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const [campaigns, setCampaigns] = useState([]);
  const [campaign, setCampaign] = useState(undefined);
  const [meta, setMeta] = useState([]);
  const [isFetched, setFetched] = useState(false);
  const [isShowCampaignModal, setCampaignModalVisibility] = useState(false);
  const [showScheduleSendModal, setShowScheduleSendModal] = useState(false);
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [keyword, setKeyword] = useState("");
  const controller = new AbortController();
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToasts();

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setCampaignModalVisibility(true);
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.createEntity", {
        entity: t("common.campaign", { entries: 1 }),
      })}
    </Button>
  );

  const inputSearchAppend = (
    <Button
      color="secondary"
      size="lg"
      onClick={() => {
        router.query.keyword = keyword;
        router.push(router);
      }}
    >
      <Icon icon="search" className="mr-2" />
      {t("common.forms.search")}
    </Button>
  );

  /**
   * The communications request should be post-render as it takes
   * time to load the campaigns which results to .
   */
  useEffect(() => {
    const getCommunications = async () => {
      const communicationsResponse = await api({
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
        url: interpolatePath(apiPaths.COMMUNICATIONS, {
          query: {
            ...context.query,
            page: context.query.page || 1,
            entity: event?.id,
            entityType: "Event",
            [`filter[grouped]`]: 1,
            include:
              "bounced_emails,received_emails,draft_emails,opened_emails",
          },
        }),
      });

      setCampaigns(communicationsResponse?.data?.data);
      setMeta(communicationsResponse?.data?.meta);
      setFetched(true);
    };

    getCommunications();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, []);

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const handleSubmit = async (params) => {
    setIsSaving(true);

    let formData = new FormData();

    const paramValues = omit(params, [
      "attachments",
      "recipients",
      "system_attachments",
    ]);

    formData.append("event_id", event.id);
    formData.append("entity_type", "Event");

    if (params.attachments) {
      params.attachments.forEach((attachment) => {
        formData.append("attachments[]", attachment);
      });
    }

    if (params.recipients) {
      formData.append(
        "recipients",
        params.recipients.map((recipient) => recipient.value).join()
      );
    }

    if (params.system_attachments) {
      formData.append("system_attachments", params.system_attachments.join());
    }

    for (const [key, value] of Object.entries(paramValues)) {
      if (isPlainObject(value)) {
        formData.append(key, value.value);
      } else {
        formData.append(key, value);
      }
    }

    try {
      await api({
        url: `/campaigns`,
        method: "POST",
        data: formData,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
          "Content-Type": "multipart/form-data",
        },
      });

      addToast("Campaign successfully saved. ", {
        appearance: "success",
        autoDismiss: true,
      });

      router.push(router);
    } catch (e) {
      addToast("Failed to save campaign. ", {
        appearance: "success",
        autoDismiss: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="Campaigns" toolbar={pageHeaderToolbar} />
      <Input.Group append={inputSearchAppend}>
        <Input
          className="input-white"
          type="text"
          size="lg"
          onChange={(value) => setKeyword(value)}
          placeholder={t("common.forms.searchEntity", {
            entity: t("common.campaign", { entries: 1 }),
          })}
        />
      </Input.Group>
      {!isFetched ? (
        <Loader.List />
      ) : (
        <CampaignList {...{ campaigns, event }} />
      )}
      {isShowCampaignModal && (
        <EmailModal
          isShow={isShowCampaignModal}
          onHide={() => setCampaignModalVisibility(false)}
          onSubmit={handleSubmit}
          isSaving={isSaving}
          onSaveAsTemplate={(params) => {
            setCampaign(params);
            setCampaignModalVisibility(false);
            setShowSaveAsTemplateModal(true);
          }}
          onScheduleSend={(params) => {
            setCampaign(params);
            setCampaignModalVisibility(false);
            setShowScheduleSendModal(true);
          }}
          onSaveAsDraft={(params) => handleSubmit({ ...params, draft: 1 })}
        />
      )}
      {showScheduleSendModal && (
        <ScheduleSendModal
          isShow={showScheduleSendModal}
          onHide={() => {
            setCampaign(undefined);
            setShowScheduleSendModal(false);
          }}
          onSubmit={(params) => {
            const dateTime = new Date(
              `${localizeDate(params?.date)} ${localizeDate(params?.time, {
                timeOnly: true,
              })}`
            );

            handleSubmit({
              ...campaign,
              ...params,
              schedule: formatISO(dateTime),
            });
          }}
          isSaving={isSaving}
        />
      )}
      {showSaveAsTemplateModal && (
        <SaveAsTemplateModal
          isShow={showSaveAsTemplateModal}
          onHide={() => {
            setCampaign(undefined);
            setShowSaveAsTemplateModal(false);
          }}
          onSubmit={async (params) => {
            try {
              setIsSaving(true);

              const session = await getSession(context);
              const headers = {
                Authorization: `Bearer ${session.accessToken}`,
                "X-Tenant": getTenant(context.req),
              };

              await api.post(
                "/mail-templates",
                {
                  ...campaign,
                  ...params,
                  entity_id: event?.id,
                  entity_type: "Event",
                  target: "Communication",
                },
                { headers }
              );

              addToast("Template successfully saved. ", {
                appearance: "success",
                autoDismiss: true,
              });

              refreshData();
            } catch (e) {
              addToast("Failed to save template.", {
                appearance: "error",
                autoDismiss: true,
              });
            } finally {
              setIsSaving(false);
              setCampaign(undefined);
              setShowSaveAsTemplateModal(false);
            }
          }}
          isSaving={isSaving}
        />
      )}
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }

  return {
    notFound: true,
  };
};

CommunicationsPage.Layout = ViewEventLayout;

export default CommunicationsPage;
