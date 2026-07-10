SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', 'd9e69bd4-22fa-42ce-ba95-9ee862fb98f1', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-18 22:09:02.327981+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd26d7b39-c218-4c82-ac08-e8e9fd0be269', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-18 23:09:49.033024+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e4b4780d-bc73-4b5a-9728-92f8ff209787', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-18 23:09:49.034919+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f17e0c45-7077-4ff3-8cef-dd1d0a0bb4a4', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-18 23:12:21.855847+00', ''),
	('00000000-0000-0000-0000-000000000000', '8ba2550a-d950-439a-bd72-2551f275f1c5', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-18 23:12:41.498376+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e853db5b-ff42-49fc-a0ec-fb26950c7c81', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-18 23:12:53.973548+00', ''),
	('00000000-0000-0000-0000-000000000000', '022b7091-f2fb-475a-88ce-eb1a10bff320', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-18 23:16:19.981165+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e416e3b3-b227-4170-ab66-92682e6c06a8', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-18 23:17:11.240626+00', ''),
	('00000000-0000-0000-0000-000000000000', '263c8634-3159-4081-b7d2-e555dcb3fd26', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-18 23:19:52.725829+00', ''),
	('00000000-0000-0000-0000-000000000000', 'afd8d2a2-9eba-4daa-86ec-e6712e6cd6cc', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-19 06:19:58.101372+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cd3b850b-be7b-48b4-a060-8c1e715cbf15', '{"action":"logout","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account"}', '2025-06-19 06:20:21.995088+00', ''),
	('00000000-0000-0000-0000-000000000000', '4348d756-4eb1-4c6b-8f2c-f806aef1f6b6', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-19 06:20:26.117525+00', ''),
	('00000000-0000-0000-0000-000000000000', '8f2c043d-9f19-473e-8964-43d2186692c4', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-19 14:32:51.94827+00', ''),
	('00000000-0000-0000-0000-000000000000', '7f5b6d1e-595d-438a-a296-1ba4245cc691', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-19 14:32:51.949225+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fcda2342-3f64-42a9-9058-2b598747b454', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-19 14:32:51.990464+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b795e491-52fa-4514-83a7-30bbcc0011cb', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-19 17:41:04.672158+00', ''),
	('00000000-0000-0000-0000-000000000000', '5b4b1e8e-ad53-4797-8060-e6879a9b470a', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-19 17:41:04.672678+00', ''),
	('00000000-0000-0000-0000-000000000000', '4e168d75-652b-497d-ab94-850209820bbf', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-19 20:36:01.264988+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f93163c-bf59-4c4b-9abe-7f6544e2d909', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-19 20:36:01.266598+00', ''),
	('00000000-0000-0000-0000-000000000000', '225f4cc1-1579-4ded-bffc-38e3fea49be7', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-19 20:36:01.305422+00', ''),
	('00000000-0000-0000-0000-000000000000', '390713f9-f225-469a-bb4a-257219d5b87b', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-19 20:36:28.84239+00', ''),
	('00000000-0000-0000-0000-000000000000', '088e40f1-a1da-4a1d-a982-3cde1a15ac7b', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-20 16:39:57.885303+00', ''),
	('00000000-0000-0000-0000-000000000000', '31dba9e0-671c-402e-8940-b30af0eb8f16', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-20 16:39:57.88663+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ddf54d13-53fd-44ae-a9cc-2d69c28f6fcd', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-20 16:39:57.930604+00', ''),
	('00000000-0000-0000-0000-000000000000', '07ea699e-5313-43dd-a393-b7e387f8c7fe', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-20 17:42:50.599515+00', ''),
	('00000000-0000-0000-0000-000000000000', '64f37cbc-b8fd-4b0c-917a-82eec247112a', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-20 17:42:50.600546+00', ''),
	('00000000-0000-0000-0000-000000000000', '5ba437c6-0995-4bae-b0f2-1aa0de9b8532', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-21 16:19:05.683688+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b97575a8-9782-4a1e-b4e2-1389e61737c2', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-22 01:33:15.408545+00', ''),
	('00000000-0000-0000-0000-000000000000', '73228c88-1e98-4c6e-82b7-21ed536b3269', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-22 03:30:45.337898+00', ''),
	('00000000-0000-0000-0000-000000000000', '1b231dc7-c616-4b41-b61a-abdf6d7cdf27', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-22 03:30:45.339305+00', ''),
	('00000000-0000-0000-0000-000000000000', '94b1f554-be1d-45a7-a365-aeae287d0101', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-22 03:30:45.388305+00', ''),
	('00000000-0000-0000-0000-000000000000', '8352537e-d3cc-406c-8f97-756ea7c1ce66', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-24 06:01:12.294623+00', ''),
	('00000000-0000-0000-0000-000000000000', '9369ff81-f1e5-4084-988e-04e8888c6169', '{"action":"logout","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account"}', '2025-06-24 06:20:10.708941+00', ''),
	('00000000-0000-0000-0000-000000000000', '76f13f1e-6407-4968-a10b-700565a9d677', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-24 06:27:55.643575+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c0f90092-d097-47bf-9a00-105e9babfd62', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-24 22:46:20.738072+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e979900a-6951-4350-b0e4-e144481da367', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-25 05:20:18.922911+00', ''),
	('00000000-0000-0000-0000-000000000000', '9cda6ae4-e086-4455-ba0b-a6b45afa94f7', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-25 05:20:18.92453+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ed17b03a-afa1-4b24-806a-6200a61b0241', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-06-25 05:20:18.970404+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cb52dd68-2e48-413e-935b-1015d21ca663', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-01 23:03:56.422228+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f9a0ef8f-1272-4fd2-a270-67d27a05398f', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 03:32:08.348583+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f1a6fa22-c70a-4b9b-bc81-7de1d89f58f3', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 03:32:08.352563+00', ''),
	('00000000-0000-0000-0000-000000000000', '5713ed06-dba9-40ee-9cc0-4bbd9eddbc21', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 03:32:08.717279+00', ''),
	('00000000-0000-0000-0000-000000000000', '9ec227a2-c912-45cb-962c-cdd96480ae80', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 04:46:10.261901+00', ''),
	('00000000-0000-0000-0000-000000000000', '5772f2b9-8f94-47c5-b629-5523e48cca30', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 04:46:10.263915+00', ''),
	('00000000-0000-0000-0000-000000000000', '543a1145-dc8b-4f21-8b82-0942aac134da', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 04:46:10.63348+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fb87b1f1-f03b-48f2-89a2-527c5eee9360', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 15:28:01.375865+00', ''),
	('00000000-0000-0000-0000-000000000000', '11fb52cb-6dca-4e76-a6d0-ae692f41ebe1', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 15:28:01.378674+00', ''),
	('00000000-0000-0000-0000-000000000000', '0da319d7-278a-4287-959e-df55b5492fc6', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 15:28:01.794508+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ca17326-a63a-4c4d-830e-05bd2bbdac21', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-02 17:33:04.181517+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ac44281e-adae-464e-a5c6-b5719eb8a8da', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-02 17:34:21.540155+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f882912b-a836-46e7-809c-22f48eb1c8be', '{"action":"login","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-02 17:37:31.58659+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f3632a44-5fb0-49fb-bb4a-a7c68f38f119', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 19:11:16.955021+00', ''),
	('00000000-0000-0000-0000-000000000000', '0bb13d7f-de37-4d38-bbf6-b91bb6a0acc2', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 19:11:16.955707+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a8234401-2576-411b-b59d-d384d12acb1e', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 19:11:16.984924+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aa595a2a-88b3-4b65-9b1d-23c979e206b5', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 22:48:07.35449+00', ''),
	('00000000-0000-0000-0000-000000000000', '56155f13-e9a7-4975-9cec-2f317416729d', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 22:48:07.356479+00', ''),
	('00000000-0000-0000-0000-000000000000', '8935d4b9-9201-4b55-8645-e07106c20029', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 22:48:07.403755+00', ''),
	('00000000-0000-0000-0000-000000000000', '42b081c0-6bd8-4839-8302-56c9c66fc715', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 17:22:22.779468+00', ''),
	('00000000-0000-0000-0000-000000000000', '86f9ca67-7a20-426a-8687-077476efa64e', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 17:22:22.780497+00', ''),
	('00000000-0000-0000-0000-000000000000', '41396569-9a51-4281-94e0-4e1a9a574618', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 17:22:22.818961+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e1bc1f6a-a203-4b39-b927-fe79d09c9810', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 00:15:28.351677+00', ''),
	('00000000-0000-0000-0000-000000000000', '8bd1dd00-5916-4436-9311-a30e8fea57df', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 00:15:28.353309+00', ''),
	('00000000-0000-0000-0000-000000000000', '6f41a188-b192-4e9f-9017-26a3441327b1', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 00:15:28.386334+00', ''),
	('00000000-0000-0000-0000-000000000000', '37ae7df5-5a76-4073-9401-81edd800c21c', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 02:47:32.098595+00', ''),
	('00000000-0000-0000-0000-000000000000', '1624d9a4-5445-4024-92b3-6aea2117330f', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 02:47:32.101337+00', ''),
	('00000000-0000-0000-0000-000000000000', '34f74b1a-bdb6-4271-a9ac-ad83e808acad', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 02:47:32.134649+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b1b9c516-baa0-47c9-bf96-d0e6b2613070', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 04:18:55.076771+00', ''),
	('00000000-0000-0000-0000-000000000000', 'baabeea1-834e-49ca-b588-cbab6e2da1af', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 04:18:55.079041+00', ''),
	('00000000-0000-0000-0000-000000000000', '9246ec07-594d-4a82-8bc7-285be32a8b37', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 04:18:55.111534+00', ''),
	('00000000-0000-0000-0000-000000000000', '84efade4-c531-416f-a2b2-bc6b375d1316', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 05:17:30.298841+00', ''),
	('00000000-0000-0000-0000-000000000000', '1be7863d-77e5-45da-b08b-8ec9eef817de', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 05:17:30.301397+00', ''),
	('00000000-0000-0000-0000-000000000000', '2e953a60-9b8c-4dac-bead-b838462d1dc8', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 20:44:47.025934+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b7bfa78b-fb2f-4772-9386-a716d4e3ef34', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 20:44:47.031556+00', ''),
	('00000000-0000-0000-0000-000000000000', '2658e660-c906-4e9c-95f2-a837434b0cfa', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 20:44:47.063377+00', ''),
	('00000000-0000-0000-0000-000000000000', '7c57d58e-1724-4aeb-ac27-365f22b1f022', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 21:46:21.727178+00', ''),
	('00000000-0000-0000-0000-000000000000', '452f51ab-7761-4d35-b9dc-60f470bbe25a', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 21:46:21.72955+00', ''),
	('00000000-0000-0000-0000-000000000000', '0f49ada7-56a3-4a03-8729-4267c8e9ca4e', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 23:59:25.904359+00', ''),
	('00000000-0000-0000-0000-000000000000', '0b80350d-259a-40b6-8be8-5c028a58a9c1', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 23:59:25.911962+00', ''),
	('00000000-0000-0000-0000-000000000000', '3c00200a-1778-4c06-b400-6ac2e9ee5b26', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 23:59:25.95626+00', ''),
	('00000000-0000-0000-0000-000000000000', '2ba7dc7a-7d6e-4467-8d19-6f52dd9e84c3', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-10 02:08:56.938323+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b5a1f829-499d-40a0-80c3-9c4f81545458', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-10 02:08:56.939597+00', ''),
	('00000000-0000-0000-0000-000000000000', '64c5fb7b-3a7e-4e3a-943a-e8123353d7d1', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-10 02:08:56.974228+00', ''),
	('00000000-0000-0000-0000-000000000000', '0feb4f4c-ac57-45d3-99b0-41ecf2c8df0d', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-10 03:07:29.582103+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f97aea5f-da00-4ec1-a1c0-36cd0d563ef1', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-10 03:07:29.58286+00', ''),
	('00000000-0000-0000-0000-000000000000', '661e1a3c-ea08-44af-a4b9-024843b8ce38', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-12 21:49:17.124014+00', ''),
	('00000000-0000-0000-0000-000000000000', '9e52e8af-017e-4ed4-b707-1cd57a2d0bb0', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-12 21:49:17.124741+00', ''),
	('00000000-0000-0000-0000-000000000000', '03ad8578-dbcf-4011-b23f-baf7166ba9a2', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-12 21:49:17.158957+00', ''),
	('00000000-0000-0000-0000-000000000000', '38852a1c-2d09-498e-b3e5-81357a8de45e', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 00:09:02.594344+00', ''),
	('00000000-0000-0000-0000-000000000000', '8e8f9a85-249b-4be8-8be3-4486f0f791e0', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 00:09:02.600072+00', ''),
	('00000000-0000-0000-0000-000000000000', '9c1005dd-d38b-4f24-83ee-71b68b5c831c', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 00:09:02.77138+00', ''),
	('00000000-0000-0000-0000-000000000000', '702b4c5e-2783-4321-8ad3-671a1fa799cf', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 01:08:38.023312+00', ''),
	('00000000-0000-0000-0000-000000000000', '746c3d24-a0af-47a4-8be0-715502a396ef', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 01:08:38.025627+00', ''),
	('00000000-0000-0000-0000-000000000000', '6114f238-1bb8-411e-9a06-015cf27542fe', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 02:25:06.870449+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a89d3cba-7407-44e3-9213-22ee967da0fd', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 02:25:06.87168+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bc8d20e7-805c-458d-a919-c70787cff27b', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 02:25:06.897296+00', ''),
	('00000000-0000-0000-0000-000000000000', '07738171-08f7-4714-a139-c9f9297d0953', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 02:27:00.547398+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f78374e4-d30f-48b9-b142-17da86d95bde', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 03:48:41.097742+00', ''),
	('00000000-0000-0000-0000-000000000000', '5832640a-40e4-46d6-a763-b181ab599e36', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 03:48:41.098977+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a6684251-40e8-479a-b49d-0bd2de3254d3', '{"action":"token_refreshed","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 04:51:00.573136+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cfb756f8-0085-4edc-88b4-97490900557e', '{"action":"token_revoked","actor_id":"64c1b2ea-9ed0-4273-8356-b6c156ae9d6a","actor_username":"test@test.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 04:51:00.575573+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', 'authenticated', 'authenticated', 'test@test.com', '$2a$06$0./BnpfuDJRQDWHH4OfzoOLK.T9omU2ae3muytlEFJHOzmDQVbkmG', '2025-06-18 22:07:58.136313+00', NULL, '', NULL, '', '2025-06-18 22:07:58.136313+00', '', '', NULL, '2025-07-02 17:37:31.587264+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-06-18 22:07:58.136313+00', '2025-07-13 04:51:00.579612+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', '{"sub": "64c1b2ea-9ed0-4273-8356-b6c156ae9d6a", "email": "test@test.com"}', 'email', '2025-06-18 22:07:58.136313+00', '2025-06-18 22:07:58.136313+00', '2025-06-18 22:07:58.136313+00', '8246f2d7-e8e8-4ccb-9142-99eb11c1abb1');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('03bf0571-3170-4d0f-8b47-365ea19ca922', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', '2025-06-24 06:27:55.646764+00', '2025-06-24 06:27:55.646764+00', NULL, 'aal1', NULL, NULL, 'node', '192.168.65.1', NULL),
	('d70c5cdc-f402-466d-ac92-73e932a0a6e3', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', '2025-06-24 22:46:20.739183+00', '2025-06-25 05:20:18.970842+00', NULL, 'aal1', NULL, '2025-06-25 05:20:18.970816', 'Next.js Middleware', '192.168.65.1', NULL),
	('0f79b4ad-1d90-4941-acba-5b37b5b715e4', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', '2025-07-01 23:03:56.42822+00', '2025-07-02 15:28:01.796142+00', NULL, 'aal1', NULL, '2025-07-02 15:28:01.796065', 'Next.js Middleware', '24.242.137.154', NULL),
	('da75fd93-009b-45a2-a456-7b6ff59ae039', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', '2025-07-02 17:33:04.184055+00', '2025-07-02 17:33:04.184055+00', NULL, 'aal1', NULL, NULL, 'node', '24.242.137.154', NULL),
	('94294c7a-0595-4bf5-a6b7-d6d2c6e44605', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', '2025-07-02 17:34:21.541708+00', '2025-07-02 17:34:21.541708+00', NULL, 'aal1', NULL, NULL, 'node', '24.242.137.154', NULL),
	('5e6bc396-db77-42b9-91ee-de4ae6473c0c', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', '2025-07-02 17:37:31.587356+00', '2025-07-13 04:51:00.581479+00', NULL, 'aal1', NULL, '2025-07-13 04:51:00.58128', 'Next.js Middleware', '192.168.65.1', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('03bf0571-3170-4d0f-8b47-365ea19ca922', '2025-06-24 06:27:55.653259+00', '2025-06-24 06:27:55.653259+00', 'password', 'f88e6773-55ee-4f79-acd2-6827918e3d8c'),
	('d70c5cdc-f402-466d-ac92-73e932a0a6e3', '2025-06-24 22:46:20.741359+00', '2025-06-24 22:46:20.741359+00', 'password', 'b15dd388-1f92-42da-8410-8c19c8941481'),
	('0f79b4ad-1d90-4941-acba-5b37b5b715e4', '2025-07-01 23:03:56.438892+00', '2025-07-01 23:03:56.438892+00', 'password', 'ee61cd47-5c8c-4fc4-95b1-de8cd29b7651'),
	('da75fd93-009b-45a2-a456-7b6ff59ae039', '2025-07-02 17:33:04.190172+00', '2025-07-02 17:33:04.190172+00', 'password', '5f7e1e6e-a8dd-429c-aef0-71ff78458376'),
	('94294c7a-0595-4bf5-a6b7-d6d2c6e44605', '2025-07-02 17:34:21.544736+00', '2025-07-02 17:34:21.544736+00', 'password', '8f0fe46f-97e2-44f0-ae25-f7000b1a8a74'),
	('5e6bc396-db77-42b9-91ee-de4ae6473c0c', '2025-07-02 17:37:31.59158+00', '2025-07-02 17:37:31.59158+00', 'password', '98480d06-7125-4edd-b371-9710c90a78a0');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 21, 'tafflqrm7oxn', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', false, '2025-06-24 06:27:55.649037+00', '2025-06-24 06:27:55.649037+00', NULL, '03bf0571-3170-4d0f-8b47-365ea19ca922'),
	('00000000-0000-0000-0000-000000000000', 22, 'nmauxbffevgr', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-06-24 22:46:20.739911+00', '2025-06-25 05:20:18.925093+00', NULL, 'd70c5cdc-f402-466d-ac92-73e932a0a6e3'),
	('00000000-0000-0000-0000-000000000000', 23, 'glxvjhvivipc', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', false, '2025-06-25 05:20:18.929096+00', '2025-06-25 05:20:18.929096+00', 'nmauxbffevgr', 'd70c5cdc-f402-466d-ac92-73e932a0a6e3'),
	('00000000-0000-0000-0000-000000000000', 24, '2ukntdm25qw6', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-01 23:03:56.434861+00', '2025-07-02 03:32:08.352912+00', NULL, '0f79b4ad-1d90-4941-acba-5b37b5b715e4'),
	('00000000-0000-0000-0000-000000000000', 25, '2v4mftwd66na', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-02 03:32:08.355685+00', '2025-07-02 04:46:10.264176+00', '2ukntdm25qw6', '0f79b4ad-1d90-4941-acba-5b37b5b715e4'),
	('00000000-0000-0000-0000-000000000000', 26, 'q5uxumvhfvf6', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-02 04:46:10.265044+00', '2025-07-02 15:28:01.378878+00', '2v4mftwd66na', '0f79b4ad-1d90-4941-acba-5b37b5b715e4'),
	('00000000-0000-0000-0000-000000000000', 27, '7bcgzfsksl2m', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', false, '2025-07-02 15:28:01.380778+00', '2025-07-02 15:28:01.380778+00', 'q5uxumvhfvf6', '0f79b4ad-1d90-4941-acba-5b37b5b715e4'),
	('00000000-0000-0000-0000-000000000000', 28, 'jk4v7o43fugd', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', false, '2025-07-02 17:33:04.18642+00', '2025-07-02 17:33:04.18642+00', NULL, 'da75fd93-009b-45a2-a456-7b6ff59ae039'),
	('00000000-0000-0000-0000-000000000000', 29, 'm7rnz7nqf257', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', false, '2025-07-02 17:34:21.54306+00', '2025-07-02 17:34:21.54306+00', NULL, '94294c7a-0595-4bf5-a6b7-d6d2c6e44605'),
	('00000000-0000-0000-0000-000000000000', 30, 'qquojsyiwwvf', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-02 17:37:31.59052+00', '2025-07-02 19:11:16.955899+00', NULL, '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 31, 'hn5o4yvd6iql', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-02 19:11:16.956737+00', '2025-07-02 22:48:07.356659+00', 'qquojsyiwwvf', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 32, '67q47aohmhmx', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-02 22:48:07.357108+00', '2025-07-04 17:22:22.780738+00', 'hn5o4yvd6iql', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 33, '32ah7gykrugf', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-04 17:22:22.78155+00', '2025-07-05 00:15:28.353518+00', '67q47aohmhmx', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 34, 'n6wbb4544stq', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-05 00:15:28.354591+00', '2025-07-05 02:47:32.101587+00', '32ah7gykrugf', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 35, 'dayw4rxwll2k', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-05 02:47:32.102229+00', '2025-07-05 04:18:55.080451+00', 'n6wbb4544stq', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 36, 'ymog2nhpmyf7', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-05 04:18:55.082463+00', '2025-07-05 05:17:30.301773+00', 'dayw4rxwll2k', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 37, 'f576o35arp6b', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-05 05:17:30.303521+00', '2025-07-05 20:44:47.032342+00', 'ymog2nhpmyf7', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 38, 'q5o7uc5zjsre', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-05 20:44:47.038506+00', '2025-07-05 21:46:21.729822+00', 'f576o35arp6b', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 39, 'kjgtqcjsonky', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-05 21:46:21.732537+00', '2025-07-09 23:59:25.914437+00', 'q5o7uc5zjsre', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 40, '356a5y3yqg6y', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-09 23:59:25.916072+00', '2025-07-10 02:08:56.939803+00', 'kjgtqcjsonky', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 41, '5ny2sfrxudbu', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-10 02:08:56.940294+00', '2025-07-10 03:07:29.583296+00', '356a5y3yqg6y', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 42, 'wxpbmnsamvjk', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-10 03:07:29.583742+00', '2025-07-12 21:49:17.124942+00', '5ny2sfrxudbu', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 43, 'gihptunzkwna', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-12 21:49:17.125818+00', '2025-07-13 00:09:02.605877+00', 'wxpbmnsamvjk', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 44, 'hrmahmrg5fpv', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-13 00:09:02.608678+00', '2025-07-13 01:08:38.025887+00', 'gihptunzkwna', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 45, '7dlpoxj6rywa', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-13 01:08:38.029897+00', '2025-07-13 02:25:06.871922+00', 'hrmahmrg5fpv', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 46, 'y3twsdmf4t5j', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-13 02:25:06.872507+00', '2025-07-13 03:48:41.099192+00', '7dlpoxj6rywa', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 47, 'hzzrm7iqhidg', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', true, '2025-07-13 03:48:41.100513+00', '2025-07-13 04:51:00.575919+00', 'y3twsdmf4t5j', '5e6bc396-db77-42b9-91ee-de4ae6473c0c'),
	('00000000-0000-0000-0000-000000000000', 48, 'mrzvevrn2iqk', '64c1b2ea-9ed0-4273-8356-b6c156ae9d6a', false, '2025-07-13 04:51:00.578038+00', '2025-07-13 04:51:00.578038+00', 'hzzrm7iqhidg', '5e6bc396-db77-42b9-91ee-de4ae6473c0c');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: allergens; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: app_information; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."app_information" ("id", "about_title", "about_description", "credits_contributors", "support_links", "created_at", "updated_at", "app_version") VALUES
	('987e7606-c084-4b71-b583-f972b8f31b0f', 'About Dine @ Michigan', 'Dine @ Michigan is your companion app for exploring dining options at the University of Michigan. Browse menus, check dining hours, and find the perfect meal on campus.', '[]', '[]', '2025-07-02 04:12:54.44+00', '2025-07-13 05:17:32.03', '1.2.1');


--
-- Data for Name: location_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."location_type" ("id", "name", "created_at", "updated_at", "display_order") VALUES
	('131bb0cb-a083-40e2-bbe2-4bc6044dd8a7', 'Convenience Store', '2025-06-19 06:02:38.275971+00', '2025-06-19 06:02:38.275971+00', 4),
	('20be80f1-7e87-424e-a7b8-801c80aca477', 'Dining Hall', '2025-06-19 06:02:38.275971+00', '2025-06-19 06:02:38.275971+00', 0),
	('a82aa62e-9860-46e3-991b-cf6ba41fdb4d', 'Food Truck', '2025-07-12 22:38:31.723011+00', '2025-07-12 22:38:31.723011+00', 2),
	('1193411e-6aba-4941-a611-fc9eb7546757', 'Coffee Shop', '2025-06-19 06:02:38.275971+00', '2025-06-19 06:02:38.275971+00', 3),
	('dc1bae58-29a1-4c1f-829e-d0c3e2ed4479', 'Food & Drink', '2025-06-19 06:02:38.275971+00', '2025-06-19 06:02:38.275971+00', 1);


--
-- Data for Name: location; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."location" ("id", "name", "colloquial_name", "description", "address", "type_id", "regular_service_hours", "methods_of_payment", "meal_times", "google_maps_link", "apple_maps_link", "image", "created_at", "updated_at", "force_close", "has_menus", "display_order", "latitude", "longitude") VALUES
	('f3c360e0-92ad-4564-bb25-88f60d8b85da', 'Sample Dining Hall', NULL, 'Sample fixture location used for local development. Replace with real data from your Supabase project.', '500 S State St, Ann Arbor, MI 48109', '20be80f1-7e87-424e-a7b8-801c80aca477', '{"friday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 2000}]}, "monday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 2000}]}, "sunday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 2000}]}, "tuesday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 2000}]}, "saturday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 2000}]}, "thursday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 2000}]}, "wednesday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 2000}]}}', '{Credit/Debit,Cash}', '{}', 'https://www.google.com/maps/search/?api=1&query=500+S+State+St+Ann+Arbor+MI+48109', 'https://maps.apple.com/?address=500%20S%20State%20St,%20Ann%20Arbor,%20MI%2048109', '', now(), now(), false, false, 0, 42.2780436, -83.7382241),
	('266222aa-046a-41a8-96b4-5b614665c17e', 'Sample Café', NULL, 'Sample fixture location used for local development. Replace with real data from your Supabase project.', '530 S State St, Ann Arbor, MI 48109', 'dc1bae58-29a1-4c1f-829e-d0c3e2ed4479', '{"friday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1800}]}, "monday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1800}]}, "sunday": {"isClosed": true, "timeRanges": [{"open": 800, "close": 1800}]}, "tuesday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1800}]}, "saturday": {"isClosed": true, "timeRanges": [{"open": 800, "close": 1800}]}, "thursday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1800}]}, "wednesday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1800}]}}', '{Credit/Debit,Cash}', '{}', 'https://www.google.com/maps/search/?api=1&query=530+S+State+St+Ann+Arbor+MI+48109', 'https://maps.apple.com/?address=530%20S%20State%20St,%20Ann%20Arbor,%20MI%2048109', '', now(), now(), false, false, 1, 42.2758, -83.7382),
	('1ab2febc-26fc-4249-aeed-e96b199f398f', 'Sample Coffee Shop', NULL, 'Sample fixture location used for local development. Replace with real data from your Supabase project.', '515 E Jefferson St, Ann Arbor, MI 48109', '1193411e-6aba-4941-a611-fc9eb7546757', '{"friday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 1600}]}, "monday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 1600}]}, "sunday": {"isClosed": true, "timeRanges": [{"open": 700, "close": 1600}]}, "tuesday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 1600}]}, "saturday": {"isClosed": true, "timeRanges": [{"open": 700, "close": 1600}]}, "thursday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 1600}]}, "wednesday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 1600}]}}', '{Credit/Debit,Cash}', '{}', 'https://www.google.com/maps/search/?api=1&query=515+E+Jefferson+St+Ann+Arbor+MI+48109', 'https://maps.apple.com/?address=515%20E%20Jefferson%20St,%20Ann%20Arbor,%20MI%2048109', '', now(), now(), false, false, 2, 42.2764, -83.7395),
	('7fce4f94-59cd-4ccf-97ac-5ce3d14609f4', 'Sample Food Truck', NULL, 'Sample fixture location used for local development. Replace with real data from your Supabase project.', 'State St & N University Ave, Ann Arbor, MI 48109', 'a82aa62e-9860-46e3-991b-cf6ba41fdb4d', '{"friday": {"isClosed": false, "timeRanges": [{"open": 1100, "close": 1500}]}, "monday": {"isClosed": false, "timeRanges": [{"open": 1100, "close": 1500}]}, "sunday": {"isClosed": true, "timeRanges": [{"open": 1100, "close": 1500}]}, "tuesday": {"isClosed": false, "timeRanges": [{"open": 1100, "close": 1500}]}, "saturday": {"isClosed": true, "timeRanges": [{"open": 1100, "close": 1500}]}, "thursday": {"isClosed": false, "timeRanges": [{"open": 1100, "close": 1500}]}, "wednesday": {"isClosed": false, "timeRanges": [{"open": 1100, "close": 1500}]}}', '{Cash,Credit/Debit}', '{}', 'https://www.google.com/maps/search/?api=1&query=State+St+%26+N+University+Ave+Ann+Arbor+MI+48109', 'https://maps.apple.com/?address=State%20St%20%26%20N%20University%20Ave,%20Ann%20Arbor,%20MI%2048109', '', now(), now(), false, false, 3, 42.2776, -83.7382),
	('7fce4f94-59cd-4ccf-97ac-5ce3d14609f5', 'Sample Convenience Store', NULL, 'Sample fixture location used for local development. Replace with real data from your Supabase project.', '911 N University Ave, Ann Arbor, MI 48109', '131bb0cb-a083-40e2-bbe2-4bc6044dd8a7', '{"friday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 2200}]}, "monday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 2200}]}, "sunday": {"isClosed": false, "timeRanges": [{"open": 1000, "close": 2200}]}, "tuesday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 2200}]}, "saturday": {"isClosed": false, "timeRanges": [{"open": 1000, "close": 2200}]}, "thursday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 2200}]}, "wednesday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 2200}]}}', '{Credit/Debit}', '{}', 'https://www.google.com/maps/search/?api=1&query=911+N+University+Ave+Ann+Arbor+MI+48109', 'https://maps.apple.com/?address=911%20N%20University%20Ave,%20Ann%20Arbor,%20MI%2048109', '', now(), now(), false, false, 4, 42.2789, -83.7378);



--
-- Data for Name: menu; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: menu_category; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: food_item; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notification_types" ("id", "name", "created_at", "updated_at") VALUES
	('b68cb27f-1eca-439c-bec0-e109a78a87a1', 'System Announcement', '2025-07-05 20:58:42.592689+00', '2025-07-05 20:58:42.592689+00'),
	('ddd275bc-9620-499b-82e0-c6a31e7c9ad3', 'Food Alert', '2025-07-05 20:59:00.068011+00', '2025-07-05 20:59:00.068011+00'),
	('9d6d913b-856b-4afe-9cbf-6ada99c29fb7', 'Location Update', '2025-07-05 20:59:07.440183+00', '2025-07-05 20:59:07.440183+00'),
	('a0510183-252a-4998-9542-621df7b0cd4a', 'Special Alert', '2025-07-05 20:59:39.775092+00', '2025-07-05 20:59:39.775092+00');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notifications" ("id", "title", "body", "redirect_url", "scheduled_at", "created_at", "sent", "type") VALUES
	('7fce4f94-59cd-4ccf-97ac-5ce3d14609f3', 'Welcome Back! 🎉', 'New menus just dropped! Tap to see what’s good on campus.', '', NULL, '2025-07-10 03:06:05.883693+00', true, 'a0510183-252a-4998-9542-621df7b0cd4a'),
	('ba6a7d24-0046-4c41-8226-8c7da68e1b8d', 'Sample Dining Hall Temporarily Closed', 'Sample Dining Hall is temporarily closed. Check other spots open nearby.', '', NULL, '2025-07-10 03:08:00.390549+00', true, '9d6d913b-856b-4afe-9cbf-6ada99c29fb7'),
	('a851565e-50f5-4797-9bed-92b1e3ef240c', '🔥 Fresh Drop at Kins', 'Pssst… steak at Kins. You didn’t hear it from me 👀', '', NULL, '2025-07-10 03:09:35.488165+00', true, 'ddd275bc-9620-499b-82e0-c6a31e7c9ad3'),
	('d15905d4-6dfc-4f44-b1f2-d311644efb23', 'Maintenance Underway', 'We’re making improvements behind the scenes. Dining info and notifications might be delayed. Everything will be back soon!', '', NULL, '2025-07-10 03:10:17.158217+00', true, 'b68cb27f-1eca-439c-bec0-e109a78a87a1');


--
-- Data for Name: nutrition; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 48, true);


--
-- Name: allergens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."allergens_id_seq"', 4859, true);


--
-- Name: food_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."food_item_id_seq"', 4859, true);


--
-- Name: menu_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."menu_category_id_seq"', 716, true);


--
-- Name: menu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."menu_id_seq"', 120, true);


--
-- Name: nutrition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."nutrition_id_seq"', 4859, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
