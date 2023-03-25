import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import { useTranslations } from "next-intl";
import SanitizedHTML from "react-sanitized-html";
import PageHeader from "@/components/common/PageHeader";
import SubmissionCategorisationForm from "@/components/forms/SubmissionCategorisationForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Note from "@/components/ui/Note";
import Wizard from "@/components/ui/Wizard2";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import getSubmissionSteps from "@/etc/submissionSteps";
import apiPaths from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { withEvent } from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";

const SubmissionPreviewPage = ({ userSubmission, headers, context, event }) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();
  const globalDispatch = useGlobalDispatch();
  const steps = getSubmissionSteps();

  const handleComplete = async () => {
    const requestParams = {
      complete: 1,
      stage: "complete",
    };

    try {
      const userSubmissionResponse = await api({
        headers,
        method: "PUT",
        data: requestParams,
        url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
          eventId: router.query.eventId,
          submissionId: router.query.submissionId,
          userSubmissionId: userSubmission.id,
        }),
      });

      router.pathname = paths.DELEGATE_SUBMISSIONS;
      router.query.eventId = context.query.eventId;
      router.push(router);
    } catch (e) {
      addToast(
        t("common.notifs.failedToUpdate", {
          entityName: t("common.userSubmission", { entries: 1 }),
          entity: userSubmission.title,
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, globalDispatch]);

  return (
    <Wizard
      {...{ steps }}
      onPrevious={({ redirectToPreviousStep }) => {
        redirectToPreviousStep({
          query: { userSubmissionId: userSubmission?.id },
        });
      }}
      onNext={handleComplete}
    >
      <Note color="warning">
        {t("page.submission.instruction.ensureAlert")}
      </Note>
      <h4 className="text-info">
        <SanitizedHTML html={userSubmission?.title} />
      </h4>
      {userSubmission?.authors?.map((author) => (
        <address key={author?.id}>
          <strong>{author.full_name}</strong>
          {author.affiliations?.map((affiliation) => (
            <>
              <br />
              {affiliation?.name}
            </>
          ))}
        </address>
      ))}
      <SanitizedHTML html={userSubmission?.content} />
    </Wizard>
  );
};

export const getServerSideProps = (context) =>
  serverSidePipe(context, [withEvent])(async (context, pipeProps) => {
    const session = await getSession(context);

    if (session) {
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      };

      if (context.query.userSubmissionId) {
        const userSubmissionResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
            eventId: context.query.eventId,
            submissionId: context.query.submissionId,
            userSubmissionId: context.query.userSubmissionId,
            query: {
              include: "authors,authors.affiliations",
            },
          }),
        });

        return {
          props: {
            headers,
            session,
            context: await getContextProps(context),
            userSubmission: userSubmissionResponse.data.data,
            ...pipeProps,
          },
        };
      }

      return {
        redirect: {
          permanent: false,
          destination: interpolatePath(
            paths.DELEGATE_SUBMISSIONS_SUBMIT_TERMS,
            {
              eventId: context.query.eventId,
              submissionId: context.query.submissionId,
            }
          ),
        },
        props: {},
      };
    }

    return {
      notFound: true,
    };
  });

SubmissionPreviewPage.authorized = true;
SubmissionPreviewPage.Layout = DashboardLayout;

export default SubmissionPreviewPage;
