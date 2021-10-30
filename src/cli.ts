#!/usr/bin/env node
import {docopt} from "docopt";

const usage = `
Usage: tslox <script>
`;

const {"<script>": script} = docopt(usage);

(async () => {
  console.log(script);
})();
